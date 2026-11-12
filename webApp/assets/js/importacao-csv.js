// Importação de CSV com prévia, usada pelos painéis Admin · Cursos e
// Admin · Unidades. Nada é gravado direto: o arquivo é comparado com o que já
// existe, a pessoa vê o que entra de novo e cada informação que seria
// substituída, e escolhe.

function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

// "Sem valor" pro tipo do campo: texto vazio, lista vazia, caixa desmarcada,
// ou um objeto em que tudo está vazio (a direção de uma unidade sem nome nem
// e-mail, por exemplo).
export function valorVazio(v) {
    if (v == null || v === '' || v === false) return true;
    if (Array.isArray(v)) return v.length === 0;
    if (typeof v === 'object') return Object.values(v).every(valorVazio);
    return false;
}

// Dois objetos com os mesmos campos em ordem diferente são o mesmo valor.
function canonico(v) {
    if (Array.isArray(v)) return v.map(canonico);
    if (v && typeof v === 'object') {
        return Object.keys(v).sort().reduce((saida, chave) => {
            saida[chave] = canonico(v[chave]);
            return saida;
        }, {});
    }
    return v;
}

function igual(a, b) {
    return JSON.stringify(canonico(a)) === JSON.stringify(canonico(b));
}

export function textoDoValor(valor) {
    if (Array.isArray(valor)) return valor.map(textoDoValor).filter(Boolean).join('; ');
    if (valor && typeof valor === 'object') {
        return Object.entries(valor)
            .map(([chave, parte]) => {
                const texto = textoDoValor(parte);
                if (!texto) return '';
                return parte && typeof parte === 'object' ? `${chave}: ${texto}` : texto;
            })
            .filter(Boolean)
            .join(' · ');
    }
    if (typeof valor === 'boolean') return valor ? 'sim' : 'não';
    return String(valor ?? '');
}

// Zona de soltar arquivo + botão que abre o seletor.
export function ligarZonaDeArquivo({ zona, botao, input, aoReceber }) {
    const elementoZona = document.getElementById(zona);
    const elementoInput = document.getElementById(input);

    document.getElementById(botao).addEventListener('click', () => elementoInput.click());
    elementoInput.addEventListener('change', (e) => {
        const arquivo = e.target.files[0];
        e.target.value = '';
        if (arquivo) aoReceber(arquivo);
    });

    ['dragenter', 'dragover'].forEach((evento) => elementoZona.addEventListener(evento, (e) => {
        e.preventDefault();
        elementoZona.classList.add('zona-arquivo--sobre');
    }));
    ['dragleave', 'drop'].forEach((evento) => elementoZona.addEventListener(evento, (e) => {
        e.preventDefault();
        elementoZona.classList.remove('zona-arquivo--sobre');
    }));
    elementoZona.addEventListener('drop', (e) => {
        const arquivo = e.dataTransfer?.files?.[0];
        if (arquivo) aoReceber(arquivo);
    });
}

// Compara o arquivo com o que já está gravado e separa em três grupos, sem
// gravar nada:
//   novos      itens que ainda não existem (entram inteiros)
//   preencher  campos que hoje estão vazios e o arquivo traz
//   substituir campos que já têm valor e o arquivo traz outro
// O que o arquivo deixa em branco nunca apaga o que já estava preenchido.
//
// itens: [{ id, nome, dados }] lidos do arquivo.
// existentes: Map(id -> documento gravado, com "camposEditados" se houver).
export function planejarImportacao(itens, existentes) {
    const plano = { novos: [], preencher: [], substituir: [], iguais: 0 };

    itens.forEach(({ id, nome, dados }) => {
        const atual = existentes.get(id);
        if (!atual) {
            plano.novos.push({ id, nome, dados });
            return;
        }

        let mudou = false;
        Object.keys(dados).forEach((campo) => {
            const novo = dados[campo];
            if (valorVazio(novo)) return;
            const antigo = atual[campo];
            if (igual(antigo, novo)) return;

            mudou = true;
            const item = { id, nome, campo, novo };
            if (valorVazio(antigo)) {
                plano.preencher.push(item);
            } else {
                plano.substituir.push({
                    ...item,
                    atual: antigo,
                    manual: (atual.camposEditados || []).includes(campo)
                });
            }
        });
        if (!mudou) plano.iguais += 1;
    });

    return plano;
}

// manter: conjunto de "id:campo" das substituições que a pessoa desmarcou.
// Devolve Map(id -> campos a gravar).
export function escritasDoPlano(plano, manter, existentes) {
    const escritas = new Map();
    const campos = (id) => {
        if (!escritas.has(id)) escritas.set(id, {});
        return escritas.get(id);
    };

    plano.novos.forEach(({ id, dados }) => escritas.set(id, { ...dados }));
    plano.preencher.forEach((item) => { campos(item.id)[item.campo] = item.novo; });

    plano.substituir.forEach((item) => {
        if (manter.has(`${item.id}:${item.campo}`)) return;
        const dados = campos(item.id);
        dados[item.campo] = item.novo;

        // O valor do arquivo entrou no lugar do que foi digitado: o campo
        // deixa de contar como "editado à mão".
        if (item.manual) {
            const editados = dados.camposEditados
                || [...(existentes.get(item.id)?.camposEditados || [])];
            dados.camposEditados = editados.filter((campo) => campo !== item.campo);
            dados.editadoManualmente = dados.camposEditados.length > 0;
        }
    });

    return escritas;
}

// A janela de revisão é a mesma nos dois painéis; é criada na primeira vez
// que alguém envia um arquivo.
function garantirJanela() {
    let modal = document.getElementById('modal-previa');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'modal-previa';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal modal--largo" role="dialog" aria-modal="true" aria-labelledby="previa-titulo">
            <div class="modal-cabecalho">
                <div>
                    <h2 id="previa-titulo">Revisar antes de importar</h2>
                    <p class="previa-arquivo" id="previa-arquivo"></p>
                </div>
                <button type="button" id="btn-fechar-previa" class="btn-fechar-modal" aria-label="Cancelar">&times;</button>
            </div>

            <div class="modal-corpo">
                <div class="previa-resumo" id="previa-resumo"></div>

                <section class="previa-secao" id="previa-substituir" hidden>
                    <div class="previa-secao-topo">
                        <div>
                            <h3>Informações que seriam substituídas</h3>
                            <p id="previa-substituir-texto"></p>
                        </div>
                        <div class="previa-atalhos">
                            <button type="button" class="btn-link" id="btn-previa-todos">Marcar todos</button>
                            <button type="button" class="btn-link" id="btn-previa-nenhum">Desmarcar todos</button>
                            <button type="button" class="btn-link" id="btn-previa-manter-meus" hidden>Manter os que editei à mão</button>
                        </div>
                    </div>
                    <div id="previa-lista-substituir"></div>
                </section>

                <details class="previa-secao previa-detalhes" id="previa-novos" hidden>
                    <summary></summary>
                    <ul class="previa-lista-simples"></ul>
                </details>

                <details class="previa-secao previa-detalhes" id="previa-preencher" hidden>
                    <summary></summary>
                    <ul class="previa-lista-simples"></ul>
                </details>

                <p class="previa-nada" id="previa-nada" hidden>O arquivo não traz nada diferente do que já está
                    gravado. Não há o que importar.</p>
            </div>

            <div class="modal-rodape">
                <span class="previa-contagem" id="previa-contagem"></span>
                <button type="button" id="btn-cancelar-previa" class="btn btn-secundario">Cancelar</button>
                <button type="button" id="btn-aplicar-previa" class="btn btn-primario">Importar</button>
            </div>
        </div>`;
    document.body.appendChild(modal);
    return modal;
}

// Em listas (os cursos de uma unidade, por exemplo), mostrar as duas listas
// inteiras não ajuda a achar a diferença: esta linha diz o que entra e o que
// sai.
function diferencaDeLista(atual, novo) {
    if (!Array.isArray(atual) || !Array.isArray(novo)) return '';
    const entram = novo.filter((item) => !atual.some((outro) => igual(item, outro)));
    const saem = atual.filter((item) => !novo.some((outro) => igual(item, outro)));
    if (!entram.length && !saem.length) return '';

    const linha = (rotulo, itens, classe) => (itens.length
        ? `<span class="${classe}"><strong>${rotulo} (${itens.length}):</strong> ${escapeHtml(itens.map(textoDoValor).join('; '))}</span>`
        : '');
    return `<div class="previa-diferenca">
        ${linha('Entram', entram, 'previa-entra')}
        ${linha('Saem', saem, 'previa-sai')}
    </div>`;
}

// Mostra o que o arquivo faria e deixa escolher quais substituições valem.
// Devolve o conjunto de "id:campo" a manter como está, ou null se a pessoa
// cancelar.
//
// opcoes.descricao  linha sob o título ("cursos-etec.csv · 157 cursos")
// opcoes.rotulos    { campo: 'nome do campo para a tela' }
// opcoes.termos     { novos: 'curso(s) novo(s)', iguais: 'curso(s) igual(is)' }
export function revisarImportacao(plano, { descricao, rotulos = {}, termos }) {
    return new Promise((resolve) => {
        const modal = garantirJanela();
        const lista = document.getElementById('previa-lista-substituir');
        const botaoAplicar = document.getElementById('btn-aplicar-previa');
        const rotulo = (campo) => rotulos[campo] || campo;
        const totalSubstituir = plano.substituir.length;
        const totalManuais = plano.substituir.filter((s) => s.manual).length;
        const temAlgo = plano.novos.length + plano.preencher.length + totalSubstituir > 0;

        document.getElementById('previa-arquivo').textContent = descricao;

        document.getElementById('previa-resumo').innerHTML = [
            [plano.novos.length, termos.novos, 'entram por inteiro', 'novo'],
            [plano.preencher.length, 'campo(s) vazio(s)', 'serão preenchidos', 'preencher'],
            [totalSubstituir, 'informação(ões) diferente(s)', 'você escolhe abaixo', 'substituir'],
            [plano.iguais, termos.iguais, 'nada muda', 'igual']
        ].map(([numero, texto, nota, tipo]) => `
            <div class="previa-numero previa-numero--${tipo}${numero ? '' : ' previa-numero--zero'}">
                <strong>${numero}</strong>
                <span>${texto}</span>
                <small>${nota}</small>
            </div>`).join('');

        // ---- substituições, agrupadas por item ----
        document.getElementById('previa-substituir').hidden = !totalSubstituir;
        document.getElementById('previa-substituir-texto').textContent =
            'Estes campos já têm um valor no Futuro+ e o arquivo traz outro. '
            + 'Marcado: o valor do arquivo entra no lugar. Desmarcado: fica como está hoje.'
            + (totalManuais ? ` ${totalManuais} deles foram editados à mão aqui no painel.` : '');
        document.getElementById('btn-previa-manter-meus').hidden = !totalManuais;

        const porItem = new Map();
        plano.substituir.forEach((item, indice) => {
            if (!porItem.has(item.id)) porItem.set(item.id, { nome: item.nome, campos: [] });
            porItem.get(item.id).campos.push({ ...item, indice });
        });

        lista.innerHTML = [...porItem.values()].map((grupo) => `
            <div class="previa-curso">
                <div class="previa-curso-nome">${escapeHtml(grupo.nome)}</div>
                ${grupo.campos.map((item) => `
                <label class="previa-item">
                    <input type="checkbox" data-indice="${item.indice}" ${item.manual ? 'data-manual' : ''} checked>
                    <div class="previa-item-corpo">
                        <div class="previa-campo">
                            ${escapeHtml(rotulo(item.campo))}
                            ${item.manual ? '<span class="previa-selo-manual">editado à mão</span>' : ''}
                        </div>
                        ${diferencaDeLista(item.atual, item.novo)}
                        <div class="previa-valores">
                            <div class="previa-valor">
                                <span class="previa-rotulo">Hoje no Futuro+</span>
                                ${escapeHtml(textoDoValor(item.atual))}
                            </div>
                            <div class="previa-valor previa-valor--novo">
                                <span class="previa-rotulo">No arquivo</span>
                                ${escapeHtml(textoDoValor(item.novo))}
                            </div>
                        </div>
                    </div>
                </label>`).join('')}
            </div>`).join('');

        // ---- itens novos e campos vazios: só informam ----
        const secaoNovos = document.getElementById('previa-novos');
        secaoNovos.hidden = !plano.novos.length;
        secaoNovos.open = false;
        secaoNovos.querySelector('summary').textContent = `Ver: ${plano.novos.length} ${termos.novos}`;
        secaoNovos.querySelector('ul').innerHTML = plano.novos
            .map((item) => `<li>${escapeHtml(item.nome)}</li>`).join('');

        const secaoPreencher = document.getElementById('previa-preencher');
        secaoPreencher.hidden = !plano.preencher.length;
        secaoPreencher.open = false;
        secaoPreencher.querySelector('summary').textContent =
            `Ver: ${plano.preencher.length} campo(s) vazio(s) que serão preenchidos`;
        secaoPreencher.querySelector('ul').innerHTML = plano.preencher.map((item) => {
            const texto = textoDoValor(item.novo);
            return `<li><strong>${escapeHtml(item.nome)}</strong> · ${escapeHtml(rotulo(item.campo))}:
                ${escapeHtml(texto.slice(0, 140))}${texto.length > 140 ? '…' : ''}</li>`;
        }).join('');

        document.getElementById('previa-nada').hidden = temAlgo;

        const caixas = () => [...lista.querySelectorAll('input[type="checkbox"]')];
        const atualizarContagem = () => {
            const marcadas = caixas().filter((c) => c.checked).length;
            const partes = [];
            if (plano.novos.length) partes.push(`${plano.novos.length} novo(s)`);
            if (plano.preencher.length) partes.push(`${plano.preencher.length} preenchido(s)`);
            if (totalSubstituir) partes.push(`${marcadas} de ${totalSubstituir} substituição(ões)`);
            document.getElementById('previa-contagem').textContent = partes.join(' · ');

            botaoAplicar.disabled = plano.novos.length + plano.preencher.length + marcadas === 0;
            if (!temAlgo) botaoAplicar.textContent = 'Nada a importar';
            else if (marcadas) botaoAplicar.textContent = `Importar e substituir ${marcadas}`;
            else botaoAplicar.textContent = 'Importar sem substituir nada';
        };

        const marcar = (decide) => {
            caixas().forEach((caixa) => { caixa.checked = decide(caixa); });
            atualizarContagem();
        };

        // Um AbortController tira todos os ouvintes de uma vez ao fechar, para
        // a próxima importação não disparar os da anterior.
        const controle = new AbortController();
        const ouvir = (id, evento, acao) => document.getElementById(id)
            .addEventListener(evento, acao, { signal: controle.signal });

        const fechar = (resultado) => {
            modal.classList.remove('aberto');
            controle.abort();
            resolve(resultado);
        };

        lista.addEventListener('change', atualizarContagem, { signal: controle.signal });
        ouvir('btn-previa-todos', 'click', () => marcar(() => true));
        ouvir('btn-previa-nenhum', 'click', () => marcar(() => false));
        ouvir('btn-previa-manter-meus', 'click', () => marcar((caixa) => !('manual' in caixa.dataset)));
        ouvir('btn-cancelar-previa', 'click', () => fechar(null));
        ouvir('btn-fechar-previa', 'click', () => fechar(null));
        ouvir('btn-aplicar-previa', 'click', () => {
            const manter = new Set();
            caixas().forEach((caixa) => {
                if (caixa.checked) return;
                const item = plano.substituir[Number(caixa.dataset.indice)];
                manter.add(`${item.id}:${item.campo}`);
            });
            fechar(manter);
        });

        atualizarContagem();
        modal.classList.add('aberto');
        modal.querySelector('.modal-corpo').scrollTop = 0;
    });
}
