// O que dá para tirar do texto de um certificado depois da leitura (OCR):
// em nome de quem ele está, qual é o curso e qual é a escola — e a ligação
// disso com o catálogo do site (cursos e unidades). Aqui só há contas com
// texto: nada de tela, nada de Firebase, para poder ser testado sozinho.

import { normalizar } from './card-unidade.js';

const PARTICULAS = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);

// Tratamentos que aparecem abreviados no cadastro ("Etec Prof. Camargo
// Aranha") e por extenso no certificado ("Professor Camargo Aranha").
const TRATAMENTOS = new Set([
    'prof', 'profa', 'professor', 'professora', 'dr', 'dra', 'doutor', 'doutora',
    'eng', 'engenheiro', 'engenheira', 'pe', 'padre', 'dep', 'deputado', 'gov', 'governador',
    'pres', 'presidente', 'cel', 'coronel', 'cons', 'conselheiro', 'com', 'comendador',
    'min', 'ministro', 'sen', 'senador', 'ver', 'vereador', 'dom', 'mons', 'monsenhor',
    'frei', 'irma', 'cap', 'capitao', 'ten', 'tenente', 'gen', 'general', 'brig', 'brigadeiro',
    'mal', 'marechal', 'pref', 'prefeito', 'des', 'desembargador', 'jorn', 'jornalista', 'dona'
]);

const semAcento = (texto) => (texto || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// Quantas letras mudam de uma palavra para a outra (com teto: acima dele a
// conta para, porque já não interessa).
function distancia(a, b, teto = 2) {
    if (Math.abs(a.length - b.length) > teto) return teto + 1;
    let anterior = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i += 1) {
        const atual = [i];
        let menor = i;
        for (let j = 1; j <= b.length; j += 1) {
            atual[j] = Math.min(
                anterior[j] + 1,
                atual[j - 1] + 1,
                anterior[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
            );
            menor = Math.min(menor, atual[j]);
        }
        if (menor > teto) return teto + 1;
        anterior = atual;
    }
    return anterior[b.length];
}

// A leitura troca uma letra aqui e ali ("Machad0", "Evangelisla"). Palavra
// curta tem que bater exata; nas compridas, uma letra de diferença passa.
export function palavraParecida(lida, esperada) {
    if (lida === esperada) return true;
    if (esperada.length < 7) return false;
    return distancia(lida, esperada, 1) <= 1;
}

const titulo = (texto) => normalizar(texto).split(' ')
    .map((palavra, i) => (i > 0 && PARTICULAS.has(palavra) ? palavra : palavra.charAt(0).toUpperCase() + palavra.slice(1)))
    .join(' ');

// ------------------------------------------------------------------
// De quem é o certificado
// ------------------------------------------------------------------

export function partesDoNome(nome) {
    return normalizar(nome).split(' ').filter((parte) => parte.length > 1 && !PARTICULAS.has(parte));
}

// "... confere a FULANA DE TAL, CPF ..." / "Certificamos que FULANO ...":
// devolve o nome como está escrito, ou '' quando o texto não segue esse
// formato.
export function titularDoCertificado(texto) {
    const linha = (texto || '').replace(/\s+/g, ' ');
    const achado = linha.match(new RegExp(
        '(?:confere[m]?|conferid[oa]|concede[m]?|concedid[oa]|outorga[m]?|certific(?:amos|am|a)|declar(?:amos|am|a))'
        + '(?:\\s+que)?\\s+(?:a[o]?\\s+|à\\s+)?(?:(?:o|a)\\s+)?(?:alun[oa]\\s+|sr\\.?a?\\.?\\s+|senhora?\\s+)?'
        + "([A-ZÀ-Ý][A-Za-zÀ-ÿ']+(?:\\s+[A-Za-zÀ-ÿ']+){1,8}?)"
        + '(?=\\s*(?:[,;.]|\\bCPF\\b|\\bRG\\b|\\bR\\.\\s?G|portador|nascid|natural\\b|conclui|participou|de nacionalidade|o presente|o t[ií]tulo|o diploma|o certificado|$))',
        'i'
    ));
    if (!achado) return '';
    const nome = achado[1].trim();
    // "certifica que o presente documento..." não é nome de ninguém
    return partesDoNome(nome).length >= 2 ? nome : '';
}

// O nome da conta aparece no certificado? Todas as partes do nome da conta
// (nome e sobrenomes, fora "de", "da"...) têm que estar lá, na ordem e
// perto umas das outras — o certificado pode ter nomes do meio a mais.
function nomeEstaNasPalavras(partes, palavras, folga = 6) {
    for (let inicio = 0; inicio < palavras.length; inicio += 1) {
        if (!palavraParecida(palavras[inicio], partes[0])) continue;
        let posicao = inicio;
        let achouTodas = true;
        for (let p = 1; p < partes.length; p += 1) {
            let proxima = -1;
            for (let i = posicao + 1; i <= Math.min(palavras.length - 1, posicao + folga); i += 1) {
                if (palavraParecida(palavras[i], partes[p])) { proxima = i; break; }
            }
            if (proxima === -1) { achouTodas = false; break; }
            posicao = proxima;
        }
        if (achouTodas) return true;
    }
    return false;
}

// motivo: 'ok' | 'conta-sem-sobrenome' | 'diferente' | 'nao-encontrado'
export function conferirNome(texto, nomeDaConta) {
    const partes = partesDoNome(nomeDaConta);
    const titular = titularDoCertificado(texto);

    if (partes.length < 2) return { confere: false, motivo: 'conta-sem-sobrenome', titular };

    if (titular) {
        const confere = nomeEstaNasPalavras(partes, partesDoNome(titular), 8);
        return { confere, motivo: confere ? 'ok' : 'diferente', titular };
    }

    const confere = nomeEstaNasPalavras(partes, normalizar(texto).split(' '));
    return { confere, motivo: confere ? 'ok' : 'nao-encontrado', titular: '' };
}

// ------------------------------------------------------------------
// Qual é a escola
// ------------------------------------------------------------------

const INICIO_DE_ESCOLA = [
    { padrao: /escola tecnica estadual\s+/g, tipo: 'etec', forte: true },
    { padrao: /faculdade de tecnologia\s+/g, tipo: 'fatec', forte: true },
    { padrao: /\betec\s+/g, tipo: 'etec', forte: false },
    { padrao: /\bfatec\s+/g, tipo: 'fatec', forte: false }
];

// Onde o nome da escola termina dentro da frase.
const FIM_DE_ESCOLA = /[,;:()]|\s(?:confere|conferem|certifica|certificam|declara|outorga|concede|torna|no uso|nos termos|situada|localizada|cnpj)\b/;

// Trechos do texto que parecem nome de Etec ou Fatec, já sem "de", "Prof."...
function trechosDeEscola(texto) {
    const limpo = semAcento(texto).replace(/\s+/g, ' ');
    const trechos = [];

    INICIO_DE_ESCOLA.forEach(({ padrao, tipo, forte }) => {
        [...limpo.matchAll(padrao)].forEach((achado) => {
            const resto = limpo.slice(achado.index + achado[0].length, achado.index + achado[0].length + 90);
            const fim = resto.search(FIM_DE_ESCOLA);
            const nome = normalizar(fim === -1 ? resto : resto.slice(0, fim));
            const palavras = nome.split(' ').filter((p) => p && !PARTICULAS.has(p) && !TRATAMENTOS.has(p));
            if (palavras.length) trechos.push({ tipo, forte, nome, palavras });
        });
    });

    return trechos;
}

// "Fatec Sorocaba – José Crespo Gonzales" atende por "Sorocaba" e por "José
// Crespo Gonzales"; "Etec Prof. Camargo Aranha (Mooca)" por "Camargo Aranha".
function apelidosDaUnidade(nome) {
    return (nome || '')
        .replace(/\([^)]*\)/g, ' ')
        .split(/\s[–—-]\s/)
        .map((parte) => normalizar(parte).split(' ')
            .filter((p) => p && !PARTICULAS.has(p) && !TRATAMENTOS.has(p)
                && !['etec', 'fatec', 'escola', 'tecnica', 'estadual', 'faculdade', 'tecnologia'].includes(p)))
        .filter((palavras) => palavras.length);
}

function pontosDoApelido(apelido, palavras) {
    if (apelido.length > palavras.length) return 0;
    let pontos = 0;
    for (let i = 0; i < apelido.length; i += 1) {
        if (palavras[i] === apelido[i]) pontos += 1;
        else if (palavraParecida(palavras[i], apelido[i])) pontos += 0.8;
        else return 0;
    }
    return pontos;
}

// unidades: [{ id, nome, tipo }]. Devolve { unidade, lido, tipo }: a unidade
// do cadastro que bate (ou null) e o nome como foi lido no papel.
export function acharUnidade(texto, unidades = []) {
    const trechos = trechosDeEscola(texto);
    if (!trechos.length) return { unidade: null, lido: '', tipo: '' };

    // "Escola Técnica Estadual X" vale mais que um "Etec" solto, que costuma
    // ser o logotipo no topo da folha lido pela metade.
    const fortes = trechos.filter((t) => t.forte);
    const candidatos = fortes.length ? fortes : trechos;

    let melhor = null;
    candidatos.forEach((trecho) => {
        unidades.forEach((unidade) => {
            if (normalizar(unidade.tipo) && normalizar(unidade.tipo) !== trecho.tipo) return;
            apelidosDaUnidade(unidade.nome).forEach((apelido) => {
                const pontos = pontosDoApelido(apelido, trecho.palavras);
                if (pontos > 0 && (!melhor || pontos > melhor.pontos)) melhor = { pontos, unidade, trecho };
            });
        });
    });

    const trecho = melhor?.trecho || candidatos[0];
    const prefixo = trecho.tipo === 'fatec' ? 'Fatec' : 'Etec';
    return {
        unidade: melhor?.unidade || null,
        // só as primeiras palavras: sem unidade para comparar, não dá para
        // saber onde o nome acaba
        lido: `${prefixo} ${titulo(trecho.nome.split(' ').slice(0, 6).join(' '))}`,
        tipo: trecho.tipo
    };
}

// Diploma de curso a distância do Centro Paula Souza (GEEaD/CETEC e afins):
// não cita uma Etec ou Fatec específica, porque o curso não é de uma
// unidade só. Quando a leitura não acha a unidade mas o texto é desses,
// quem pendura o certificado escolhe a unidade no Mural (ver
// unidadeTemCurso, que confere se a escolhida faz sentido).
export function pareceDiplomaEad(texto) {
    return /\bgeead\b|\bead\b|educac[a-z]*\s+a\s+distanc/i.test(normalizar(texto));
}

// ------------------------------------------------------------------
// Qual é o curso
// ------------------------------------------------------------------

// Palavras que vêm logo antes do nome do curso: "Técnico em ...", "Nível
// Médio em ...", "Curso Superior de Tecnologia em ...".
const ANTES_DO_CURSO = /^(tecnic[oa]s?|tecnologia|tecnolog[oa]|medio|especializacao|especialista|habilitacao|qualificacao|curso|superior|graduacao)$/;

export function nivelDoTexto(texto) {
    const limpo = normalizar(texto);
    return /faculdade de tecnologia|\bfatec\b|tecnolog[oa]\b|curso superior|graduacao/.test(limpo) ? 'superior' : 'tecnico';
}

export function tipoDeFormacao(texto) {
    const limpo = normalizar(texto);
    if (/especializacao|especialista/.test(limpo)) return 'Especialização técnica';
    if (nivelDoTexto(texto) === 'superior') return 'Superior de Tecnologia';
    if (/qualificacao/.test(limpo)) return 'Qualificação';
    if (/tecnic[oa] em|habilitacao profissional/.test(limpo)) return 'Técnico';
    return '';
}

const nivelDoCurso = (curso) => (curso.nivel === 'superior' ? 'superior' : 'tecnico');

// cursos: [{ id, nome, nivel }]. Procura o nome de um curso do catálogo logo
// depois de "técnico em", "tecnologia em"...; nome comprido (3 palavras ou
// mais) também vale solto no texto.
export function acharCurso(texto, cursos = []) {
    const palavras = normalizar(texto).split(' ');
    const nivel = nivelDoTexto(texto);

    const inicios = [];
    palavras.forEach((palavra, i) => {
        if (palavra !== 'em' && palavra !== 'de') return;
        if (palavras.slice(Math.max(0, i - 5), i).some((anterior) => ANTES_DO_CURSO.test(anterior))) inicios.push(i + 1);
    });

    let melhor = null;
    const disputar = (curso, pontos) => {
        const total = pontos + (nivelDoCurso(curso) === nivel ? 0.5 : 0);
        if (!melhor || total > melhor.pontos) melhor = { pontos: total, curso };
    };

    cursos.forEach((curso) => {
        const nome = normalizar(curso.nome).split(' ').filter(Boolean);
        if (!nome.length) return;

        inicios.forEach((inicio) => {
            const pontos = pontosDoApelido(nome, palavras.slice(inicio, inicio + nome.length));
            if (pontos > 0) disputar(curso, pontos + 10);
        });

        if (nome.length >= 3 && ` ${palavras.join(' ')} `.includes(` ${nome.join(' ')} `)) disputar(curso, nome.length);
    });

    return melhor?.curso || null;
}

// Sem curso do catálogo: aproveita o nome em maiúsculas depois de "em"
// ("... de Nível Médio em DESENHO DE MODA.").
function cursoEscrito(texto) {
    const achado = (texto || '').replace(/\s+/g, ' ').match(/\b(?:em|de)\s+([A-ZÀ-Ý][A-ZÀ-Ý ]{5,80}[A-ZÀ-Ý])(?=[.,;]|\s+[a-zà-ÿ]|$)/);
    return achado ? titulo(achado[1]) : '';
}

export function anoDeConclusao(texto) {
    const limpo = normalizar(texto);
    // "concluído em 2025", "concluído em 15 de dezembro de 2023", "concluído
    // o Curso Superior de Tecnologia em Logística em 2024", "ano letivo de
    // 2025", "ano de conclusão: 2025"
    const achado = limpo.match(/conclu[a-z]*\b[a-z0-9 ]{0,90}?\bem (?:\d{1,2} de [a-z]+ de )?((?:19|20)\d{2})\b/)
        || limpo.match(/por haver [a-z ]{0,28}((?:19|20)\d{2})\b/)
        || limpo.match(/ano letivo de ((?:19|20)\d{2})\b/)
        || limpo.match(/ano de conclusao[a-z :]{0,10}((?:19|20)\d{2})\b/);
    return achado ? Number(achado[1]) : null;
}

// ------------------------------------------------------------------
// Tudo junto, e a regra do repetido
// ------------------------------------------------------------------

export function lerDadosDoCertificado(texto, { cursos = [], unidades = [] } = {}) {
    const escola = acharUnidade(texto, unidades);
    const curso = acharCurso(texto, cursos);
    return {
        curso,
        cursoLido: curso ? curso.nome : cursoEscrito(texto),
        unidade: escola.unidade,
        unidadeLida: escola.unidade ? escola.unidade.nome : escola.lido,
        tipoFormacao: tipoDeFormacao(texto),
        anoConclusao: anoDeConclusao(texto)
    };
}

// Quando a pessoa digita ou corrige o campo: o texto é de um curso/unidade
// do catálogo?
export function cursoPeloNome(nome, cursos = [], nivelPreferido = 'tecnico') {
    const procurado = normalizar(nome);
    if (!procurado) return null;
    const iguais = cursos.filter((curso) => normalizar(curso.nome) === procurado);
    return iguais.find((curso) => nivelDoCurso(curso) === nivelPreferido) || iguais[0] || null;
}

export function unidadePeloNome(nome, unidades = []) {
    const procurado = normalizar(nome);
    if (!procurado) return null;
    return unidades.find((unidade) => normalizar(unidade.nome) === procurado) || null;
}

// A unidade escolhida à mão (quando a leitura não achou nenhuma, como no
// diploma de EaD) realmente tem esse curso no cadastro? unidade vem do
// catálogo de instituições, com o campo "cursos" dela.
export function unidadeTemCurso(unidade, nomeDoCurso) {
    const procurado = normalizar(nomeDoCurso);
    if (!procurado) return false;
    return (unidade?.cursos || []).some((curso) => normalizar(curso?.nome) === procurado);
}

// Dois certificados são o mesmo quando são do mesmo curso na mesma escola
// (ou têm o mesmo código de validação).
export function chaveDoCertificado(certificado) {
    const curso = certificado.cursoId || `t:${normalizar(certificado.titulo)}`;
    const escola = certificado.unidadeId || `i:${normalizar(certificado.instituicao)}`;
    return `${curso}|${escola}`;
}

export function certificadoRepetido(novo, existentes = []) {
    const chave = chaveDoCertificado(novo);
    const codigo = normalizar(novo.verificacao?.codigoValidacao);
    return existentes.find((existente) => chaveDoCertificado(existente) === chave
        || (codigo && normalizar(existente.verificacao?.codigoValidacao) === codigo)) || null;
}
