import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { db } from "./firebase-config.js";
import { categoriasTeste } from "./categorias-teste.js";
import { escapeHtml, normalizar } from "./card-unidade.js";
import { distanciaKm, formatarDistancia, localizarRuaDoAluno } from "./geocodificacao.js";

// ============================================================
// Afinidade de cada curso com as 8 inteligências (1 = leve, 3 = forte).
// É uma primeira versão pedagógica — vale revisar com um orientador.
// Cursos cadastrados depois e que não estejam aqui simplesmente não
// entram nas recomendações até ganharem uma linha nesta tabela.
// ============================================================
const PESOS_CURSOS = {
    "Administração": { interpessoal: 2, intrapessoal: 2, logica: 1, linguistica: 1 },
    "Desenvolvimento de Sistemas": { logica: 3, espacial: 1, intrapessoal: 1 },
    "Recursos Humanos": { interpessoal: 3, linguistica: 1, intrapessoal: 1 },
    "Logística": { logica: 2, espacial: 2, interpessoal: 1 },
    "Informática para Internet": { logica: 3, espacial: 2 },
    "Marketing": { linguistica: 3, interpessoal: 2, espacial: 1 },
    "Química": { logica: 3, naturalista: 2 },
    "Segurança do Trabalho": { corporal: 2, naturalista: 1, interpessoal: 1, logica: 1 },
    "Informática": { logica: 3, espacial: 1 },
    "Enfermagem": { corporal: 3, interpessoal: 3, naturalista: 1 },
    "Secretariado": { linguistica: 3, interpessoal: 2, intrapessoal: 1 },
    "Contabilidade": { logica: 3, intrapessoal: 1 },
    "Comércio": { interpessoal: 3, linguistica: 2, logica: 1 },
    "Meio Ambiente": { naturalista: 3, logica: 1 },
    "Guia de Turismo": { linguistica: 3, interpessoal: 3, corporal: 1, naturalista: 1 },
    "Gestão de Projetos - EaD": { intrapessoal: 3, logica: 2, interpessoal: 1 },
    "Mecânica": { corporal: 3, logica: 2, espacial: 2 },
    "Eletrônica": { logica: 3, corporal: 2, espacial: 1 },
    "Nutrição e Dietética": { naturalista: 3, interpessoal: 1, logica: 1 },
    "Eletrotécnica": { logica: 3, corporal: 2 },
    "Transações Imobiliárias": { interpessoal: 3, linguistica: 2, logica: 1 },
    "Automação Industrial": { logica: 3, espacial: 2, corporal: 1 },
    "Agropecuária": { naturalista: 3, corporal: 2 },
    "Serviços Jurídicos": { linguistica: 3, logica: 2, intrapessoal: 1 },
    "Edificações": { espacial: 3, logica: 2, corporal: 1 },
    "Gastronomia": { corporal: 3, espacial: 1, naturalista: 1, interpessoal: 1 },
    "Farmácia": { naturalista: 2, logica: 2, interpessoal: 1 },
    "Mecatrônica": { logica: 3, corporal: 2, espacial: 2 },
    "Agronegócio": { naturalista: 3, logica: 2, interpessoal: 1 },
    "Finanças": { logica: 3, intrapessoal: 2 },
    "Eletroeletrônica": { logica: 3, corporal: 2 },
    "Eventos": { interpessoal: 3, musical: 2, linguistica: 1, espacial: 1 },
    "Eletromecânica": { corporal: 3, logica: 2, espacial: 1 },
    "Açúcar e Álcool": { naturalista: 2, logica: 2 },
    "Programação de Jogos Digitais": { logica: 3, espacial: 3, musical: 1 },
    "Alimentos": { naturalista: 2, logica: 2, corporal: 1 },
    "Comércio Exterior": { linguistica: 2, interpessoal: 2, logica: 2 },
    "Design de Interiores": { espacial: 3, intrapessoal: 1 },
    "Design Gráfico": { espacial: 3, linguistica: 1, musical: 1 },
    "Manutenção e Suporte em Informática": { logica: 2, corporal: 2, interpessoal: 1 },
    "Agroindústria": { naturalista: 3, logica: 1, corporal: 1 },
    "Turismo Receptivo": { interpessoal: 3, linguistica: 2 },
    "Qualidade": { logica: 3, intrapessoal: 1 },
    "Redes de Computadores": { logica: 3, espacial: 1 },
    "Desenho de Construção Civil": { espacial: 3, logica: 1 },
    "Agenciamento de Viagem": { interpessoal: 3, linguistica: 2 },
    "Zootecnia": { naturalista: 3, corporal: 1 },
    "Agrimensura": { espacial: 3, logica: 2, naturalista: 1 },
    "Cálculos Trabalhistas": { logica: 3, linguistica: 1 },
    "Soldagem": { corporal: 3, espacial: 1 },
    "Sistemas de Energia Renovável": { naturalista: 2, logica: 2, corporal: 1 },
    "Ciência de Dados": { logica: 3, intrapessoal: 1 },
    "Defesa Civil": { interpessoal: 2, naturalista: 2, corporal: 2 },
    "Administrador de Banco de Dados": { logica: 3 },
    "Gestão de Energia": { logica: 2, naturalista: 2 },
    "Design de Móveis": { espacial: 3, corporal: 2 },
    "Modelagem do Vestuário": { espacial: 3, corporal: 2 },
    "Serviços Públicos": { interpessoal: 2, linguistica: 2, logica: 1 },
    "Biotecnologia": { naturalista: 3, logica: 2 },
    "Logística Reversa": { logica: 2, naturalista: 2 },
    "Multimídia": { espacial: 3, musical: 2, linguistica: 1 },
    "Urgência e Emergência - APH (Atendimento Pré-Hospitalar)": { corporal: 3, interpessoal: 2 },
    "Florestas": { naturalista: 3, corporal: 1 },
    "Manutenção de Máquinas Pesadas": { corporal: 3, logica: 1, espacial: 1 },
    "Metalurgia": { corporal: 2, logica: 2 },
    "Guia de Turismo Internacional": { linguistica: 3, interpessoal: 3 },
    "Gestão de Unidades de Alimentação e Nutrição": { naturalista: 2, intrapessoal: 2, interpessoal: 1 },
    "Paisagismo": { naturalista: 3, espacial: 3 },
    "Processos Fotográficos": { espacial: 3, intrapessoal: 1 },
    "Gastronomia hospitalar": { corporal: 2, naturalista: 2, interpessoal: 1 },
    "Gastronomia Brasileira": { corporal: 3, naturalista: 1 },
    "Bioprocessos": { naturalista: 3, logica: 2 },
    "Veterinária": { naturalista: 3, corporal: 2 },
    "Auxiliar Administrativo, Auxiliar de Finanças e Auxiliar de Marketing e Comercial": { interpessoal: 2, logica: 1, linguistica: 1 },
    "Manutenção Automotiva": { corporal: 3, logica: 2 },
    "Automação Predial": { logica: 3, espacial: 2 },
    "Centro Cirúrgico e Instrumentação Cirúrgica": { corporal: 3, interpessoal: 1 },
    "Higiene Ocupacional": { naturalista: 2, logica: 1, interpessoal: 1 },
    "Canto": { musical: 3, corporal: 1, intrapessoal: 1 },
    "Regência": { musical: 3, interpessoal: 2 },
    "Publicidade": { linguistica: 3, espacial: 2, interpessoal: 1 },
    "Cafeicultura": { naturalista: 3, corporal: 1 },
    "Gestão Ambiental": { naturalista: 3, logica: 1, interpessoal: 1 },
    "Hospedagem": { interpessoal: 3, linguistica: 1 },
    "Segurança do Trabalho na Construção Civil": { corporal: 2, espacial: 1, interpessoal: 1 },
    "Agente Comunitário de Saúde": { interpessoal: 3, linguistica: 1 },
    "Turismo de Experiência": { interpessoal: 2, naturalista: 2, corporal: 1 },
    "Viticultura e Enologia": { naturalista: 3, corporal: 1 },
    "Enogastronomia": { corporal: 2, naturalista: 2, interpessoal: 1 },
    "Panificação e Confeitaria": { corporal: 3, espacial: 1 },
    "Desenvolvimento Comunitário": { interpessoal: 3, intrapessoal: 1, linguistica: 1 },
    "Análise de Dados para Questões Sociais": { logica: 3, interpessoal: 1 },
    "Assessoria Parlamentar": { linguistica: 3, interpessoal: 2 },
    "Dança": { corporal: 3, musical: 3 },
    "Teatro": { linguistica: 3, corporal: 2, interpessoal: 1, musical: 1 },
    "Composição e Arranjo": { musical: 3, intrapessoal: 1 },
    "Danças a Dois": { corporal: 3, musical: 3, interpessoal: 1 },
    "Organização Esportiva": { corporal: 3, interpessoal: 2 },
    "Saúde do Trabalhador": { interpessoal: 2, corporal: 1, naturalista: 1 },
    "Portos": { logica: 2, espacial: 2 },
    "Agenciamento Marítimo": { interpessoal: 2, linguistica: 2, logica: 1 },
    "Mineração": { naturalista: 2, corporal: 2, logica: 1 },
    "Telecomunicações": { logica: 3, espacial: 1 },
    "Agricultura": { naturalista: 3, corporal: 2 },
    "Oncologia": { interpessoal: 3, naturalista: 1, corporal: 1 },
    "Sistema Fotovoltaico": { logica: 2, naturalista: 2, corporal: 1 },
    "Produção de Áudio e Vídeo": { musical: 3, espacial: 2, linguistica: 1 },
    "Saúde Bucal": { corporal: 2, interpessoal: 2 },
    "Design de Moda": { espacial: 3, intrapessoal: 1 },
    "Organização de Eventos Corporativos": { interpessoal: 3, linguistica: 1 },
    "Arquivo": { intrapessoal: 2, logica: 2, linguistica: 1 },
    "Biblioteconomia": { linguistica: 3, intrapessoal: 2 },
    "Museologia": { linguistica: 2, espacial: 2, intrapessoal: 1 },
    "Prótese Dentária": { corporal: 3, espacial: 2 },
    "Prótese Ortodôntica": { corporal: 3, espacial: 2 },
    "Prótese Sobre Implantes": { corporal: 3, espacial: 2 },
    "Prótese fixa com ênfase em cerâmica": { corporal: 3, espacial: 2 },
    "Vidro": { corporal: 2, espacial: 2 },
    "Assistente de Recursos Humanos": { interpessoal: 3, linguistica: 1 },
    "Fabricação Mecânica": { corporal: 3, espacial: 2, logica: 1 },
    "Segurança do Alimento – Ênfase em Controle de Qualidade em Unidade de Alimentação e Nutrição": { naturalista: 2, logica: 2 },
    "Curtimento": { naturalista: 2, corporal: 2 },
    "Equipamentos Biomédicos": { logica: 3, naturalista: 1, corporal: 1 },
    "Supervisão de Manutenção Elétrica Industrial": { logica: 2, interpessoal: 2, corporal: 1 },
    "Agroecologia": { naturalista: 3, intrapessoal: 1 },
    "Produção de Cana de Açúcar": { naturalista: 3, corporal: 1 },
    "Gastronomia Internacional": { corporal: 3, linguistica: 1 },
    "Transporte Metroferroviário": { logica: 2, corporal: 2, espacial: 1 },
    "Desenvolvimento de Aplicativos para Smartphones": { logica: 3, espacial: 2 },
    "Saneamento": { naturalista: 3, logica: 1 },
    "Cuidados de Idosos": { interpessoal: 3, corporal: 2 },
};

// Peso de cada uma das 3 inteligências mais fortes do resultado.
const FATORES_POSICAO = [1, 0.75, 0.5];

// Níveis de proximidade entre a pessoa e uma unidade.
export const PROXIMIDADE = { CIDADE: 0, REGIAO: 1, REGIAO_AMPLA: 2, LONGE: 3 };

const PESOS_NORMALIZADOS = new Map(
    Object.entries(PESOS_CURSOS).map(([nome, pesos]) => [normalizar(nome), pesos])
);

// ============================================================
// Cache no navegador (é só otimização: se o storage estiver
// bloqueado ou cheio, tudo continua funcionando buscando de novo)
// ============================================================
function lerCache(storage, chave, validadeMs) {
    try {
        const bruto = storage.getItem(chave);
        if (!bruto) return null;
        const { salvoEm, dados } = JSON.parse(bruto);
        return Date.now() - salvoEm < validadeMs ? dados : null;
    } catch {
        return null;
    }
}

function gravarCache(storage, chave, dados) {
    try {
        storage.setItem(chave, JSON.stringify({ salvoEm: Date.now(), dados }));
    } catch {
        // storage indisponível: segue sem cache
    }
}

// ============================================================
// Oferta: quais unidades oferecem cada curso
// ============================================================
let ofertaEmMemoria = null;
const CHAVE_OFERTA = "futuroplus:ofertaCursos:v2";

// Guardado por sessão (sessionStorage) para a home não reler as 229
// unidades a cada visita, mas ainda refletir o que o admin alterar.
export async function carregarOfertaCursos() {
    if (ofertaEmMemoria) return ofertaEmMemoria;

    let cursos = lerCache(sessionStorage, CHAVE_OFERTA, 6 * 60 * 60 * 1000);

    if (!cursos) {
        const snap = await getDocs(collection(db, "etecs"));
        cursos = {};
        snap.docs.forEach((documento) => {
            const u = documento.data();
            const unidade = {
                id: documento.id,
                nome: u.nome,
                municipio: u.municipio,
                logotipoUrl: u.logotipoUrl || "",
                localizacao: u.localizacao?.lat != null
                    ? { lat: u.localizacao.lat, lng: u.localizacao.lng, precisao: u.localizacao.precisao }
                    : null
            };
            const nomesNaUnidade = new Set((u.cursos || []).map((c) => c?.nome).filter(Boolean));
            nomesNaUnidade.forEach((nome) => {
                const chave = normalizar(nome);
                if (!cursos[chave]) cursos[chave] = { nome, unidades: [] };
                cursos[chave].unidades.push(unidade);
            });
        });
        gravarCache(sessionStorage, CHAVE_OFERTA, cursos);
    }

    ofertaEmMemoria = new Map(Object.entries(cursos));
    return ofertaEmMemoria;
}

// ============================================================
// Regiões do IBGE (região imediata e intermediária, divisão de 2017):
// agrupam cidades pelo deslocamento real das pessoas. Servem de plano B
// quando a unidade ou a pessoa ainda não tem coordenadas.
// ============================================================
let regioesEmMemoria = null;

export async function carregarRegioesSP() {
    if (regioesEmMemoria) return regioesEmMemoria;

    let municipios = lerCache(localStorage, "futuroplus:regioesSP:v1", 30 * 24 * 60 * 60 * 1000);

    if (!municipios) {
        const resposta = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados/SP/municipios");
        if (!resposta.ok) throw new Error(`IBGE respondeu ${resposta.status}`);
        const lista = await resposta.json();
        municipios = lista.map((m) => [
            normalizar(m.nome),
            m["regiao-imediata"]?.id ?? null,
            m["regiao-imediata"]?.["regiao-intermediaria"]?.id ?? null
        ]);
        gravarCache(localStorage, "futuroplus:regioesSP:v1", municipios);
    }

    regioesEmMemoria = new Map(municipios.map(([nome, imediata, intermediaria]) => [nome, { imediata, intermediaria }]));
    return regioesEmMemoria;
}

// ============================================================
// Localização da pessoa
// ============================================================
const TENTAR_LOCALIZAR_DE_NOVO_MS = 30 * 24 * 60 * 60 * 1000;

// Completa, uma única vez por conta, o que faltar no perfil: a cidade (pelo
// CEP, via ViaCEP) e a coordenada da rua (via OpenStreetMap). Se a rua não
// for encontrada, registra a tentativa para não repetir a consulta a cada
// visita durante 30 dias.
export async function resolverLocalizacaoUsuario(uid, dadosUsuario) {
    if (!dadosUsuario) return null;

    let cidade = dadosUsuario.cidade || "";
    let uf = dadosUsuario.estado || "";
    let rua = dadosUsuario.rua || "";
    const atualizacoes = {};

    if (!cidade) {
        const cep = (dadosUsuario.cep || "").replace(/\D/g, "");
        if (cep.length !== 8) return null;
        try {
            const dados = await (await fetch(`https://viacep.com.br/ws/${cep}/json/`)).json();
            if (dados.erro || !dados.localidade) return null;
            cidade = dados.localidade;
            uf = uf || dados.uf || "";
            rua = rua || dados.logradouro || "";
            atualizacoes.cidade = cidade;
        } catch (erro) {
            console.error("Erro ao consultar o CEP:", erro);
            return null;
        }
    }

    let localizacao = dadosUsuario.localizacao || null;
    const tentouHaPouco = localizacao?.naoEncontrada
        && Date.now() - Date.parse(localizacao.tentadoEm || 0) < TENTAR_LOCALIZAR_DE_NOVO_MS;

    if (localizacao?.lat == null && !tentouHaPouco) {
        localizacao = await localizarRuaDoAluno({ rua, cidade, uf: uf || "SP" })
            || { naoEncontrada: true, tentadoEm: new Date().toISOString() };
        atualizacoes.localizacao = localizacao;
    }

    if (uid && Object.keys(atualizacoes).length) {
        setDoc(doc(db, "usuarios", uid), atualizacoes, { merge: true })
            .catch((erro) => console.error("Não foi possível salvar a localização no perfil:", erro));
    }

    return {
        cidade,
        uf,
        lat: localizacao?.lat ?? null,
        lng: localizacao?.lng ?? null,
        precisao: localizacao?.precisao || null
    };
}

// ============================================================
// Proximidade entre a pessoa e uma unidade
// ============================================================

// Quando falta coordenada de um dos lados, a distância é estimada pelo
// nível de região, só para ordenar de forma coerente com quem tem km.
const KM_ESTIMADO_POR_NIVEL = [8, 35, 90, 400];

function nivelProximidade(unidade, localizacao, regioes, regiaoUsuario) {
    if (!localizacao) return PROXIMIDADE.LONGE;
    const cidadeUnidade = normalizar(unidade.municipio);
    if (cidadeUnidade === normalizar(localizacao.cidade)) return PROXIMIDADE.CIDADE;
    if (!regiaoUsuario || !regioes) return PROXIMIDADE.LONGE;

    const regiaoUnidade = regioes.get(cidadeUnidade);
    if (!regiaoUnidade) return PROXIMIDADE.LONGE;
    if (regiaoUnidade.imediata === regiaoUsuario.imediata) return PROXIMIDADE.REGIAO;
    if (regiaoUnidade.intermediaria === regiaoUsuario.intermediaria) return PROXIMIDADE.REGIAO_AMPLA;
    return PROXIMIDADE.LONGE;
}

// Devolve uma função que, para cada unidade, diz o nível de proximidade e,
// quando der, a distância real em km.
export function criarAvaliadorProximidade(localizacao, regioes) {
    const regiaoUsuario = localizacao && regioes && (localizacao.uf || "SP").toUpperCase() === "SP"
        ? regioes.get(normalizar(localizacao.cidade))
        : null;

    return (unidade) => {
        const nivel = nivelProximidade(unidade, localizacao, regioes, regiaoUsuario);
        let km = distanciaKm(localizacao, unidade.localizacao);

        // Coordenada que é só o centro da cidade não diz nada dentro da
        // própria cidade: ali o km confundiria mais do que ajudaria.
        const algumLadoSoCidade = localizacao?.precisao === "cidade" || unidade.localizacao?.precisao === "cidade";
        if (nivel === PROXIMIDADE.CIDADE && algumLadoSoCidade) km = null;

        return { nivel, km, ordem: km ?? KM_ESTIMADO_POR_NIVEL[nivel] };
    };
}

function unidadesPorProximidade(unidades, avaliar) {
    return unidades
        .map((u) => {
            const { nivel, km, ordem } = avaliar(u);
            return { ...u, proximidade: nivel, km, ordem };
        })
        .sort((a, b) => a.ordem - b.ordem || (a.nome || "").localeCompare(b.nome || "", "pt-BR"));
}

function resumirProximidade(unidades) {
    return {
        naCidade: unidades.filter((u) => u.proximidade === PROXIMIDADE.CIDADE).length,
        perto: unidades.filter((u) => u.ordem <= 25).length
    };
}

// ============================================================
// Ranking
// ============================================================

// Afinidade = soma, nas 3 inteligências mais fortes, de
// (porcentagem da pessoa × peso da posição × peso do curso).
// Depois dois ajustes pequenos, que desempatam sem mudar o perfil:
// cursos oferecidos em mais unidades e cursos com unidade a até ~25 km
// sobem um pouco, porque são mais fáceis de efetivamente cursar.
export function calcularRecomendacoes(resultado, { oferta, localizacao = null, regioes = null, limite = 8 } = {}) {
    const top = (resultado?.ranking || []).slice(0, 3);
    if (!top.length || !oferta) return [];

    const avaliar = criarAvaliadorProximidade(localizacao, regioes);
    const recomendacoes = [];

    for (const [chave, pesos] of PESOS_NORMALIZADOS) {
        const curso = oferta.get(chave);
        if (!curso) continue;

        let afinidade = 0;
        let maiorContribuicao = 0;
        let motivo = null;

        top.forEach((inteligencia, posicao) => {
            const contribuicao = ((resultado.porcentagens?.[inteligencia] || 0) / 100)
                * FATORES_POSICAO[posicao]
                * (pesos[inteligencia] || 0);
            afinidade += contribuicao;
            if (contribuicao > maiorContribuicao) {
                maiorContribuicao = contribuicao;
                motivo = inteligencia;
            }
        });

        if (afinidade <= 0) continue;

        const unidades = unidadesPorProximidade(curso.unidades, avaliar);
        const { naCidade, perto } = resumirProximidade(unidades);

        const fatorOferta = 1 + 0.1 * Math.log10(unidades.length);
        const fatorPerto = perto > 0 ? 1.15 : 1;

        recomendacoes.push({
            nome: curso.nome,
            motivo,
            pontuacao: afinidade * fatorOferta * fatorPerto,
            unidades,
            naCidade,
            perto
        });
    }

    return recomendacoes
        .sort((a, b) => b.pontuacao - a.pontuacao)
        .slice(0, limite);
}

// Para quem ainda não tem resultado: os cursos oferecidos em mais unidades.
export function cursosMaisOferecidos(oferta, { localizacao = null, regioes = null, limite = 8 } = {}) {
    const avaliar = criarAvaliadorProximidade(localizacao, regioes);
    return [...oferta.values()]
        .sort((a, b) => b.unidades.length - a.unidades.length)
        .slice(0, limite)
        .map((curso) => {
            const unidades = unidadesPorProximidade(curso.unidades, avaliar);
            return { nome: curso.nome, motivo: null, unidades, ...resumirProximidade(unidades) };
        });
}

// ============================================================
// Textos de apoio
// ============================================================
export function textoMotivo(recomendacao) {
    const nome = categoriasTeste[recomendacao.motivo];
    return nome ? `Combina com seu perfil ${nome}` : "";
}

export function textoOferta(recomendacao, localizacao) {
    const total = recomendacao.unidades.length;
    const totalTexto = `Em ${total} Etec${total === 1 ? "" : "s"}`;
    const maisPerto = recomendacao.unidades[0];
    if (!localizacao || !maisPerto) return totalTexto;

    if (maisPerto.km != null) {
        return `${totalTexto} · mais perto: ${formatarDistancia(maisPerto.km)}, em ${maisPerto.municipio}`;
    }
    if (recomendacao.naCidade > 0) {
        return `${totalTexto} · ${recomendacao.naCidade} em ${localizacao.cidade}`;
    }
    if (maisPerto.proximidade <= PROXIMIDADE.REGIAO_AMPLA) {
        return `${totalTexto} · mais perto: ${maisPerto.municipio}`;
    }
    return totalTexto;
}

export function linkCurso(nomeCurso) {
    return `cursos.html?curso=${encodeURIComponent(nomeCurso)}`;
}

// ============================================================
// Bloco usado na tela de resultado dos testes
// ============================================================
export async function renderizarRecomendacoesTeste(container, resultado, { uid = null } = {}) {
    if (!container) return;
    container.innerHTML = `<p class="recomendacoes-carregando">Buscando cursos das Etecs para o seu perfil...</p>`;

    try {
        const dadosUsuario = uid
            ? await getDoc(doc(db, "usuarios", uid)).then((snap) => (snap.exists() ? snap.data() : null)).catch(() => null)
            : null;

        const [oferta, localizacao] = await Promise.all([
            carregarOfertaCursos(),
            resolverLocalizacaoUsuario(uid, dadosUsuario)
        ]);
        const regioes = localizacao ? await carregarRegioesSP().catch(() => null) : null;
        const recomendacoes = calcularRecomendacoes(resultado, { oferta, localizacao, regioes, limite: 6 });

        if (!recomendacoes.length) {
            container.innerHTML = "";
            return;
        }

        container.innerHTML = `
            <div class="recomendacoes-teste">
                <h3>🎯 Cursos das Etecs que combinam com você</h3>
                <p class="recomendacoes-teste-sub">
                    Calculado a partir das suas 3 inteligências mais fortes${localizacao ? `, priorizando unidades perto de ${escapeHtml(localizacao.cidade)}` : ""}.
                </p>
                <ul class="lista-recomendacoes">
                    ${recomendacoes.map((r) => `
                        <li>
                            <a href="${linkCurso(r.nome)}">
                                <span class="recomendacao-nome">${escapeHtml(r.nome)}</span>
                                <span class="recomendacao-motivo">${escapeHtml(textoMotivo(r))}</span>
                                <span class="recomendacao-oferta">${escapeHtml(textoOferta(r, localizacao))}</span>
                            </a>
                        </li>
                    `).join("")}
                </ul>
            </div>
        `;
    } catch (erro) {
        console.error("Erro ao montar recomendações de cursos:", erro);
        container.innerHTML = "";
    }
}
