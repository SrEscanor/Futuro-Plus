import { onAuthStateChanged } from 'firebase/auth';
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth, db, app } from './firebase-config.js';
import { escapeHtml, normalizar, paginaDaUnidade } from './card-unidade.js';
import {
    lerCertificado, areasDeCpf, borrarAreas, canvasParaArquivo, reduzirImagem
} from './certificado-ocr.js';
import {
    lerDadosDoCertificado, conferirNome, cursoPeloNome, unidadePeloNome, certificadoRepetido, nivelDoTexto
} from './certificado-dados.js';

const storage = getStorage(app);
const CATALOGO_OFICIAL = '/dados/catalogo-cursos.json';

let usuarioAtual = null;
let nomeDaConta = '';
let certificados = [];
// { arquivo, analise, lido, nivel, titular, mensagem, tipoMensagem }
let emPreparo = null;
// cursos e unidades do site, para ligar o certificado ao catálogo; só são
// buscados quando a pessoa vai pendurar o primeiro certificado da visita
let catalogo = null;

const elemento = (id) => document.getElementById(id);

// Limites para o mural não virar conta no fim do mês: a imagem é reduzida
// antes de subir, e cada aluno guarda no máximo 20 certificados.
const TAMANHO_MAXIMO_MB = 8;
const MAXIMO_CERTIFICADOS = 20;
// Quantos ficam pendurados de uma vez: mais que isso a parede vira uma
// lista comprida e perde a graça. O resto abre no "ver todos".
const VISIVEIS_POR_PADRAO = 8;

let mostrandoTodos = false;

// ------------------------------------------------------------------
// Parede
// ------------------------------------------------------------------

// "Etec Sebrae · 2025"; os certificados antigos, sem ano, mostram as horas
function detalheDoCertificado(certificado) {
    return [
        certificado.instituicao,
        certificado.anoConclusao || (certificado.cargaHoraria ? `${certificado.cargaHoraria}h` : '')
    ].filter(Boolean).join(' · ');
}

function renderizarMural() {
    const parede = elemento('mural-quadros');
    const botaoNovo = elemento('btn-novo-certificado');
    const verMais = elemento('btn-ver-mais');

    parede.querySelectorAll('.mural-quadro--certificado').forEach((quadro) => quadro.remove());

    const visiveis = mostrandoTodos ? certificados : certificados.slice(0, VISIVEIS_POR_PADRAO);

    visiveis.forEach((certificado) => {
        const quadro = document.createElement('figure');
        quadro.className = 'mural-quadro mural-quadro--certificado';
        quadro.dataset.id = certificado.id;
        quadro.innerHTML = `
            <div class="mural-moldura">
                <img src="${escapeHtml(certificado.url)}" alt="${escapeHtml(certificado.titulo || 'Certificado')}" loading="lazy">
            </div>
            <figcaption>
                <strong>${escapeHtml(certificado.titulo || 'Certificado')}</strong>
                <span>${escapeHtml(detalheDoCertificado(certificado))}</span>
            </figcaption>
            <button type="button" class="mural-remover" data-id="${escapeHtml(certificado.id)}"
                title="Remover do mural" aria-label="Remover ${escapeHtml(certificado.titulo || 'certificado')}">&times;</button>`;
        parede.insertBefore(quadro, botaoNovo);
    });

    const escondidos = certificados.length - visiveis.length;
    verMais.hidden = escondidos <= 0 && !mostrandoTodos;
    verMais.textContent = mostrandoTodos
        ? 'Mostrar menos'
        : `Ver todos (mais ${escondidos})`;

    elemento('mural-contagem').textContent = certificados.length
        ? `${certificados.length} certificado${certificados.length > 1 ? 's' : ''} no seu mural`
        : 'Nenhum certificado ainda — pendure o primeiro';
}

// Sem login a parede aparece do mesmo jeito, mas no lugar do quadro de
// "Adicionar certificado" fica o quadro que pede para entrar na conta.
function mostrarParede({ logado }) {
    elemento('mural-app').hidden = false;
    elemento('mural-quadros').classList.toggle('mural-quadros--visitante', !logado);
    elemento('mural-quadro-entrar').hidden = logado;
    elemento('btn-novo-certificado').hidden = !logado;

    if (!logado) {
        certificados = [];
        renderizarMural();
        elemento('mural-contagem').textContent = 'Entre na sua conta para montar o seu mural';
    }
}

async function carregarCertificados() {
    const snap = await getDocs(collection(db, 'usuarios', usuarioAtual.uid, 'certificados'));
    certificados = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.criadoEm || '').localeCompare(a.criadoEm || ''));
    renderizarMural();
}

// ------------------------------------------------------------------
// Catálogo: cursos e unidades do site
// ------------------------------------------------------------------

async function carregarCatalogo() {
    if (catalogo) return catalogo;

    const ler = (colecao, campos) => getDocs(collection(db, colecao))
        .then((snap) => snap.docs.map((d) => ({ id: d.id, ...campos(d.data()) })))
        .catch((erro) => {
            console.error(`Não consegui carregar ${colecao}:`, erro);
            return [];
        });

    let [cursos, unidades] = await Promise.all([
        ler('cursos', (dados) => ({ nome: dados.nome || '', nivel: dados.nivel || '' })),
        ler('instituicoes', (dados) => ({ nome: dados.nome || '', tipo: dados.tipo || '' }))
    ]);

    // enquanto o catálogo não foi importado no painel, vale o arquivo oficial
    if (!cursos.length) {
        cursos = await fetch(CATALOGO_OFICIAL).then((resposta) => resposta.json())
            .then((lista) => lista.map((curso) => ({ id: curso.slug, nome: curso.nome, nivel: curso.nivel || '' })))
            .catch(() => []);
    }

    cursos = cursos.filter((curso) => curso.nome);
    unidades = unidades.filter((unidade) => unidade.nome);
    catalogo = { cursos, unidades };

    const opcoes = (nomes) => [...new Set(nomes)].sort((a, b) => a.localeCompare(b, 'pt-BR'))
        .map((nome) => `<option value="${escapeHtml(nome)}"></option>`).join('');
    elemento('lista-cursos-mural').innerHTML = opcoes(cursos.map((curso) => curso.nome));
    elemento('lista-unidades-mural').innerHTML = opcoes(unidades.map((unidade) => unidade.nome));

    return catalogo;
}

// ------------------------------------------------------------------
// Envio: lê, confere o nome, borra o CPF e preenche curso e escola
// ------------------------------------------------------------------

function mostrarStatus(texto, tipo = '', link = null) {
    const status = elemento('status-certificado');
    status.className = `mural-status ${tipo ? `mural-status--${tipo}` : ''}`;
    status.innerHTML = escapeHtml(texto)
        + (link ? ` <a href="${escapeHtml(link.href)}">${escapeHtml(link.rotulo)}</a>` : '');
}

function mostrarAchados(analise, nome, lido, cpfBorrado) {
    const achados = elemento('achados-certificado');
    const itens = [];

    itens.push(analise.pareceCertificado
        ? `<li class="ok">Encontrei palavras de certificado: ${escapeHtml(analise.termosEncontrados.slice(0, 3).join(', '))}</li>`
        : '<li class="alerta">Não achei palavras típicas de certificado nesta imagem</li>');

    if (nome.confere) {
        itens.push(`<li class="ok">${nome.titular
            ? `Está em nome de ${escapeHtml(nome.titular)}, que bate com o da sua conta`
            : 'O nome da sua conta aparece no certificado'}</li>`);
    } else {
        itens.push(`<li class="erro">${nome.titular
            ? `Está em nome de ${escapeHtml(nome.titular)}, diferente do nome da sua conta`
            : 'Não encontrei o nome da sua conta no certificado'}</li>`);
    }

    if (lido.cursoLido) {
        itens.push(`<li class="ok">Curso: ${escapeHtml(lido.cursoLido)}${lido.curso ? ' (está no catálogo do Futuro+)' : ''}</li>`);
    }
    if (lido.unidadeLida) {
        itens.push(`<li class="ok">Escola: ${escapeHtml(lido.unidadeLida)}${lido.unidade ? ' (unidade cadastrada no Futuro+)' : ''}</li>`);
    } else if (analise.instituicao) {
        itens.push(`<li class="ok">Instituição citada: ${escapeHtml(analise.instituicao)}</li>`);
    }
    if (lido.anoConclusao) itens.push(`<li class="ok">Concluído em ${lido.anoConclusao}</li>`);
    if (analise.codigoValidacao) itens.push(`<li class="ok">Código de validação: ${escapeHtml(analise.codigoValidacao)}</li>`);
    if (cpfBorrado) itens.push('<li class="ok">CPF encontrado e coberto antes do envio</li>');

    achados.innerHTML = `<ul>${itens.join('')}</ul>`;
    achados.hidden = false;
}

// O certificado só entra no mural se estiver no nome de quem é a conta.
function recusaPeloNome(nome) {
    if (nome.motivo === 'conta-sem-sobrenome') {
        return {
            texto: 'Para pendurar certificados, seu perfil precisa ter nome e sobrenome, iguais aos do certificado.',
            link: { href: 'perfil.html', rotulo: 'Completar meu perfil' }
        };
    }
    if (nome.motivo === 'diferente') {
        return {
            texto: `Certificado recusado: ele está em nome de ${nome.titular}, e a sua conta está como ${nomeDaConta}. `
                + 'Só dá para pendurar certificado que está no seu nome.',
            link: { href: 'perfil.html', rotulo: 'Corrigir meu nome no perfil' }
        };
    }
    return {
        texto: `Certificado recusado: não encontrei o nome ${nomeDaConta} nesta imagem. `
            + 'Tente uma foto mais nítida, de frente e bem iluminada, e confira se o nome do seu perfil está igual ao do certificado.',
        link: { href: 'perfil.html', rotulo: 'Ver meu perfil' }
    };
}

// O que está nos campos agora, já ligado ao catálogo quando o texto é o
// nome de um curso ou de uma unidade que o site conhece.
function dadosDosCampos() {
    const titulo = elemento('cert-titulo').value.trim();
    const instituicao = elemento('cert-instituicao').value.trim();

    const unidade = unidadePeloNome(instituicao, catalogo?.unidades);
    // "Logística" existe como técnico e como superior: quem decide é a escola
    const nivel = unidade
        ? (normalizar(unidade.tipo) === 'etec' ? 'tecnico' : 'superior')
        : (emPreparo?.nivel || 'tecnico');
    const curso = cursoPeloNome(titulo, catalogo?.cursos, nivel);

    return {
        titulo,
        instituicao,
        cursoId: curso?.id || '',
        unidadeId: unidade?.id || '',
        verificacao: { codigoValidacao: emPreparo?.analise?.codigoValidacao || '' }
    };
}

function marcarLigacao(id, texto) {
    const aviso = elemento(id);
    aviso.textContent = texto;
    aviso.hidden = !texto;
}

// Roda a cada mudança nos campos e de novo na hora de salvar: sem nome de
// curso não vai, e o mesmo certificado não entra duas vezes.
function validarCampos() {
    if (!emPreparo) return false;

    const dados = dadosDosCampos();
    const botao = elemento('btn-salvar-certificado');

    marcarLigacao('cert-titulo-ligado', dados.cursoId
        ? '✓ Curso do catálogo: entra nas suas formações, com link para a página do curso.' : '');
    marcarLigacao('cert-instituicao-ligado', dados.unidadeId
        ? '✓ Unidade cadastrada no Futuro+.' : '');

    if (!dados.titulo) {
        mostrarStatus('Escreva o nome do curso ou do evento para pendurar.', 'alerta');
        botao.disabled = true;
        return false;
    }

    const repetido = certificadoRepetido(dados, certificados);
    if (repetido) {
        const qual = [repetido.titulo, repetido.instituicao].filter(Boolean).join(', ');
        mostrarStatus(`Este certificado já está no seu mural (${qual}). O mesmo certificado não entra duas vezes.`, 'erro');
        botao.disabled = true;
        return false;
    }

    mostrarStatus(emPreparo.mensagem, emPreparo.tipoMensagem);
    botao.disabled = false;
    return true;
}

async function prepararCertificado(arquivoOriginal) {
    if (arquivoOriginal.size > TAMANHO_MAXIMO_MB * 1024 * 1024) {
        alert(`Esta imagem tem mais de ${TAMANHO_MAXIMO_MB} MB. Tire a foto com menos resolução ou reduza o arquivo.`);
        return;
    }
    if (certificados.length >= MAXIMO_CERTIFICADOS) {
        alert(`Seu mural já tem ${MAXIMO_CERTIFICADOS} certificados. Remova algum para adicionar outro.`);
        return;
    }

    elemento('modal-certificado').classList.add('aberto');
    elemento('achados-certificado').hidden = true;
    elemento('campos-certificado').hidden = true;
    elemento('btn-salvar-certificado').disabled = true;
    elemento('cert-titulo').value = '';
    elemento('cert-instituicao').value = '';
    marcarLigacao('cert-titulo-ligado', '');
    marcarLigacao('cert-instituicao-ligado', '');
    emPreparo = null;

    const previa = elemento('previa-certificado');
    previa.src = URL.createObjectURL(arquivoOriginal);
    mostrarStatus('Preparando a imagem...');

    try {
        const { arquivo } = await reduzirImagem(arquivoOriginal);
        previa.src = URL.createObjectURL(arquivo);
        mostrarStatus('Lendo o certificado no seu computador... (a primeira vez baixa o leitor e demora um pouco)');

        const [{ texto, palavras, analise }, { cursos, unidades }] = await Promise.all([
            lerCertificado(arquivo, (porcentagem) => mostrarStatus(`Lendo o certificado... ${porcentagem}%`)),
            carregarCatalogo()
        ]);

        // o CPF é coberto aqui, antes de qualquer envio
        const areas = areasDeCpf(palavras);
        let arquivoFinal = arquivo;

        if (areas.length) {
            const imagem = new Image();
            imagem.src = previa.src;
            await imagem.decode();
            const canvas = borrarAreas(imagem, areas);
            arquivoFinal = await canvasParaArquivo(canvas, arquivo.name.replace(/\.[^.]+$/, '') + '.jpg');
            previa.src = canvas.toDataURL('image/jpeg', 0.85);
        }

        const nome = conferirNome(texto, nomeDaConta);
        const lido = lerDadosDoCertificado(texto, { cursos, unidades });
        mostrarAchados(analise, nome, lido, areas.length > 0);

        if (!nome.confere) {
            const recusa = recusaPeloNome(nome);
            mostrarStatus(recusa.texto, 'erro', recusa.link);
            return;
        }

        elemento('cert-titulo').value = lido.cursoLido;
        elemento('cert-instituicao').value = lido.unidadeLida
            || (analise.instituicao ? analise.instituicao.replace(/\b\w/g, (letra) => letra.toUpperCase()) : '');
        elemento('campos-certificado').hidden = false;

        emPreparo = {
            arquivo: arquivoFinal,
            analise,
            lido,
            nivel: nivelDoTexto(texto),
            titular: nome.titular,
            mensagem: analise.pareceCertificado
                ? 'Pronto. Confira os dados abaixo e pendure no mural.'
                : 'Isso não parece um certificado. Se você tem certeza, dá para enviar assim mesmo.',
            tipoMensagem: analise.pareceCertificado ? 'ok' : 'alerta'
        };
        validarCampos();
    } catch (erro) {
        console.error('Erro ao ler o certificado:', erro);
        // sem leitura não dá para conferir de quem é o certificado
        mostrarStatus('Não consegui ler esta imagem, então não deu para conferir o nome. '
            + 'Tente uma foto mais nítida, de frente e bem iluminada.', 'erro');
    }
}

async function salvarCertificado() {
    if (!emPreparo || !validarCampos()) return;

    const botao = elemento('btn-salvar-certificado');
    const dados = dadosDosCampos();
    botao.disabled = true;
    mostrarStatus('Enviando...');

    const id = `cert_${Date.now()}`;
    const caminho = `certificados/${usuarioAtual.uid}/${id}.jpg`;

    try {
        const referencia = ref(storage, caminho);
        await uploadBytes(referencia, emPreparo.arquivo, { contentType: 'image/jpeg' });
        const url = await getDownloadURL(referencia);

        await setDoc(doc(db, 'usuarios', usuarioAtual.uid, 'certificados', id), {
            titulo: dados.titulo,
            instituicao: dados.instituicao,
            // ligação com o catálogo: é o que deixa o perfil mostrar a
            // formação com link para o curso e para a escola
            cursoId: dados.cursoId,
            unidadeId: dados.unidadeId,
            tipoFormacao: dados.cursoId ? (emPreparo.lido.tipoFormacao || '') : '',
            anoConclusao: emPreparo.lido.anoConclusao || null,
            titular: emPreparo.titular || '',
            url,
            caminho,
            // o que a leitura encontrou fica registrado: é o histórico da conferência
            verificacao: {
                pareceCertificado: emPreparo.analise.pareceCertificado === true,
                nomeConfere: true,
                // o que foi lido no papel, separado do que a pessoa pode ter
                // corrigido nos campos: é o que vale para liberar o que
                // depender de ter estudado naquela escola (comentários)
                cursoLido: emPreparo.lido.curso?.id || '',
                unidadeLida: emPreparo.lido.unidade?.id || '',
                codigoValidacao: emPreparo.analise.codigoValidacao || '',
                conferidoEm: new Date().toISOString()
            },
            criadoEm: new Date().toISOString()
        });

        fecharModal();
        await carregarCertificados();
    } catch (erro) {
        console.error('Erro ao salvar o certificado:', erro);
        mostrarStatus('Não consegui enviar agora. Tente de novo.', 'alerta');
        botao.disabled = false;
    }
}

async function removerCertificado(id) {
    const certificado = certificados.find((c) => c.id === id);
    if (!certificado) return;
    if (!confirm(`Remover "${certificado.titulo || 'este certificado'}" do seu mural?`)) return;

    try {
        await deleteDoc(doc(db, 'usuarios', usuarioAtual.uid, 'certificados', id));
        if (certificado.caminho) await deleteObject(ref(storage, certificado.caminho)).catch(() => {});
        await carregarCertificados();
    } catch (erro) {
        console.error('Erro ao remover o certificado:', erro);
        alert('Não consegui remover agora. Tente de novo.');
    }
}

function fecharModal() {
    elemento('modal-certificado').classList.remove('aberto');
    elemento('input-certificado').value = '';
    emPreparo = null;
}

// ------------------------------------------------------------------
// Lightbox: ver o certificado clicado em tamanho grande
// ------------------------------------------------------------------

function abrirLightbox(certificado) {
    const detalhe = detalheDoCertificado(certificado);

    elemento('mural-lightbox-img').src = certificado.url;
    elemento('mural-lightbox-img').alt = certificado.titulo || 'Certificado';
    elemento('mural-lightbox-legenda').innerHTML = `
        <strong>${escapeHtml(certificado.titulo || 'Certificado')}</strong>
        ${detalhe ? `<span>${escapeHtml(detalhe)}</span>` : ''}
        ${certificado.cursoId
            ? `<a href="curso.html?c=${encodeURIComponent(certificado.cursoId)}">Ver a página do curso &rarr;</a>`
            : ''}
        ${certificado.unidadeId
            ? `<a href="${escapeHtml(paginaDaUnidade(certificado.unidadeId))}">Ver a página da escola &rarr;</a>`
            : ''}`;
    elemento('mural-lightbox').classList.add('aberto');
}

function fecharLightbox() {
    elemento('mural-lightbox').classList.remove('aberto');
    elemento('mural-lightbox-img').src = '';
}

// ------------------------------------------------------------------
// Início
// ------------------------------------------------------------------

onAuthStateChanged(auth, async (usuario) => {
    usuarioAtual = usuario || null;
    mostrarParede({ logado: Boolean(usuario) });
    if (!usuario) return;

    try {
        const snap = await getDoc(doc(db, 'usuarios', usuario.uid));
        const dados = snap.exists() ? snap.data() : {};
        nomeDaConta = [dados.nome, dados.sobrenome].filter(Boolean).join(' ');
        await carregarCertificados();
    } catch (erro) {
        console.error('Erro ao carregar o mural:', erro);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const input = elemento('input-certificado');

    elemento('btn-novo-certificado')?.addEventListener('click', () => input.click());
    input?.addEventListener('change', (e) => {
        const arquivo = e.target.files[0];
        if (arquivo) prepararCertificado(arquivo);
    });

    elemento('btn-salvar-certificado')?.addEventListener('click', salvarCertificado);
    elemento('btn-cancelar-certificado')?.addEventListener('click', fecharModal);
    elemento('btn-fechar-certificado')?.addEventListener('click', fecharModal);
    elemento('modal-certificado')?.addEventListener('click', (e) => {
        if (e.target.id === 'modal-certificado') fecharModal();
    });
    ['cert-titulo', 'cert-instituicao'].forEach((id) => {
        elemento(id)?.addEventListener('input', validarCampos);
    });

    elemento('btn-ver-mais')?.addEventListener('click', () => {
        mostrandoTodos = !mostrandoTodos;
        renderizarMural();
    });

    elemento('mural-quadros')?.addEventListener('click', (e) => {
        const botaoRemover = e.target.closest('.mural-remover');
        if (botaoRemover) {
            removerCertificado(botaoRemover.dataset.id);
            return;
        }
        const quadro = e.target.closest('.mural-quadro--certificado');
        if (quadro) {
            const certificado = certificados.find((c) => c.id === quadro.dataset.id);
            if (certificado) abrirLightbox(certificado);
        }
    });

    elemento('btn-fechar-lightbox')?.addEventListener('click', fecharLightbox);
    elemento('mural-lightbox')?.addEventListener('click', (e) => {
        if (e.target.id === 'mural-lightbox') fecharLightbox();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && elemento('mural-lightbox')?.classList.contains('aberto')) fecharLightbox();
    });
});

export { prepararCertificado, renderizarMural };
