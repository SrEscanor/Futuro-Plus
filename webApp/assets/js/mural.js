import { onAuthStateChanged } from 'firebase/auth';
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth, db, app } from './firebase-config.js';
import { escapeHtml } from './card-unidade.js';
import {
    lerCertificado, areasDeCpf, borrarAreas, canvasParaArquivo, nomeAparece, reduzirImagem
} from './certificado-ocr.js';

const storage = getStorage(app);

let usuarioAtual = null;
let nomeDaConta = '';
let certificados = [];
let emPreparo = null; // { arquivo, analise, nomeBate }

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

function renderizarMural() {
    const parede = elemento('mural-quadros');
    const botaoNovo = elemento('btn-novo-certificado');
    const verMais = elemento('btn-ver-mais');

    parede.querySelectorAll('.mural-quadro--certificado').forEach((quadro) => quadro.remove());

    const visiveis = mostrandoTodos ? certificados : certificados.slice(0, VISIVEIS_POR_PADRAO);

    visiveis.forEach((certificado) => {
        const quadro = document.createElement('figure');
        quadro.className = 'mural-quadro mural-quadro--certificado';
        quadro.innerHTML = `
            <div class="mural-moldura">
                <img src="${escapeHtml(certificado.url)}" alt="${escapeHtml(certificado.titulo || 'Certificado')}" loading="lazy">
            </div>
            <figcaption>
                <strong>${escapeHtml(certificado.titulo || 'Certificado')}</strong>
                <span>${escapeHtml([certificado.instituicao, certificado.cargaHoraria ? `${certificado.cargaHoraria}h` : '']
                    .filter(Boolean).join(' · '))}</span>
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

async function carregarCertificados() {
    const snap = await getDocs(collection(db, 'usuarios', usuarioAtual.uid, 'certificados'));
    certificados = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.criadoEm || '').localeCompare(a.criadoEm || ''));
    renderizarMural();
}

// ------------------------------------------------------------------
// Envio: lê, confere e borra o CPF antes de subir
// ------------------------------------------------------------------

function mostrarStatus(texto, tipo = '') {
    const status = elemento('status-certificado');
    status.textContent = texto;
    status.className = `mural-status ${tipo ? `mural-status--${tipo}` : ''}`;
}

function mostrarAchados(analise, nomeBate, cpfBorrado) {
    const achados = elemento('achados-certificado');
    const itens = [];

    itens.push(analise.pareceCertificado
        ? `<li class="ok">Encontrei palavras de certificado: ${escapeHtml(analise.termosEncontrados.slice(0, 3).join(', '))}</li>`
        : '<li class="alerta">Não achei palavras típicas de certificado nesta imagem</li>');

    if (analise.instituicao) itens.push(`<li class="ok">Instituição citada: ${escapeHtml(analise.instituicao)}</li>`);
    if (analise.cargaHoraria) itens.push(`<li class="ok">Carga horária: ${analise.cargaHoraria} horas</li>`);
    if (analise.codigoValidacao) itens.push(`<li class="ok">Código de validação: ${escapeHtml(analise.codigoValidacao)}</li>`);
    itens.push(nomeBate
        ? '<li class="ok">O nome do certificado bate com o da sua conta</li>'
        : '<li class="alerta">Não consegui confirmar seu nome no certificado</li>');
    if (cpfBorrado) itens.push('<li class="ok">CPF encontrado e borrado antes do envio</li>');

    achados.innerHTML = `<ul>${itens.join('')}</ul>`;
    achados.hidden = false;
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
    emPreparo = null;

    const previa = elemento('previa-certificado');
    previa.src = URL.createObjectURL(arquivoOriginal);
    mostrarStatus('Preparando a imagem...');

    try {
        const { arquivo } = await reduzirImagem(arquivoOriginal);
        previa.src = URL.createObjectURL(arquivo);
        mostrarStatus('Lendo o certificado no seu computador... (a primeira vez baixa o leitor e demora um pouco)');
        const { texto, palavras, analise } = await lerCertificado(arquivo, (porcentagem) => {
            mostrarStatus(`Lendo o certificado... ${porcentagem}%`);
        });

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

        const nomeBate = nomeAparece(texto, nomeDaConta);
        mostrarAchados(analise, nomeBate, areas.length > 0);

        elemento('cert-instituicao').value = analise.instituicao
            ? analise.instituicao.replace(/\b\w/g, (letra) => letra.toUpperCase())
            : '';
        elemento('cert-horas').value = analise.cargaHoraria || '';
        elemento('campos-certificado').hidden = false;
        elemento('btn-salvar-certificado').disabled = false;

        mostrarStatus(analise.pareceCertificado
            ? 'Pronto. Confira os dados abaixo e pendure no mural.'
            : 'Isso não parece um certificado. Se você tem certeza, dá para enviar assim mesmo.',
            analise.pareceCertificado ? 'ok' : 'alerta');

        emPreparo = { arquivo: arquivoFinal, analise, nomeBate };
    } catch (erro) {
        console.error('Erro ao ler o certificado:', erro);
        mostrarStatus('Não consegui ler a imagem. Você ainda pode enviar e preencher os dados à mão.', 'alerta');
        elemento('campos-certificado').hidden = false;
        elemento('btn-salvar-certificado').disabled = false;
        emPreparo = { arquivo: arquivoOriginal, analise: { pareceCertificado: false }, nomeBate: false };
    }
}

async function salvarCertificado() {
    if (!emPreparo) return;

    const botao = elemento('btn-salvar-certificado');
    botao.disabled = true;
    mostrarStatus('Enviando...');

    const id = `cert_${Date.now()}`;
    const caminho = `certificados/${usuarioAtual.uid}/${id}.jpg`;

    try {
        const referencia = ref(storage, caminho);
        await uploadBytes(referencia, emPreparo.arquivo, { contentType: 'image/jpeg' });
        const url = await getDownloadURL(referencia);

        const horas = elemento('cert-horas').value.trim();
        await setDoc(doc(db, 'usuarios', usuarioAtual.uid, 'certificados', id), {
            titulo: elemento('cert-titulo').value.trim() || 'Certificado',
            instituicao: elemento('cert-instituicao').value.trim(),
            cargaHoraria: horas ? Number(horas) : null,
            url,
            caminho,
            // o que a leitura encontrou fica registrado: é o histórico da conferência
            verificacao: {
                pareceCertificado: emPreparo.analise.pareceCertificado === true,
                nomeConfere: emPreparo.nomeBate === true,
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
// Início
// ------------------------------------------------------------------

onAuthStateChanged(auth, async (usuario) => {
    if (!usuario) {
        elemento('mural-precisa-login').hidden = false;
        elemento('mural-app').hidden = true;
        return;
    }

    usuarioAtual = usuario;
    elemento('mural-precisa-login').hidden = true;
    elemento('mural-app').hidden = false;

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

    elemento('btn-ver-mais')?.addEventListener('click', () => {
        mostrandoTodos = !mostrandoTodos;
        renderizarMural();
    });

    elemento('mural-quadros')?.addEventListener('click', (e) => {
        const botao = e.target.closest('.mural-remover');
        if (botao) removerCertificado(botao.dataset.id);
    });
});

export { prepararCertificado, renderizarMural };
