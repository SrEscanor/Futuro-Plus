// Lista do que conta pra um perfil "completo" — usada na barra de progresso
// do Perfil e no lembrete do sino (notificacoes.js), pra não ter duas versões
// do mesmo critério espalhadas pelo código.
import { extrairResultadoMaisRecente, extrairResultadoVocacional } from './resultado-teste.js';

export const ITENS_DO_PERFIL = [
    { rotulo: 'cidade no cadastro', completo: (d) => Boolean(d.cadastro.cidade || d.cadastro.cep) },
    { rotulo: 'seu momento nos estudos', completo: (d) => Boolean(d.perfil.escolaridade) },
    { rotulo: 'sua formação', completo: (d) => Boolean(d.perfil.formacao || d.perfil.semFormacao) },
    { rotulo: 'o curso que você quer', completo: (d) => Boolean(d.perfil.cursoDesejado) },
    { rotulo: 'suas áreas de interesse', completo: (d) => (d.perfil.modalidades || []).length > 0 },
    { rotulo: 'seu estilo de aprendizado', completo: (d) => (d.perfil.estilos || []).length > 0 },
    { rotulo: 'seu objetivo', completo: (d) => Boolean(d.perfil.objetivo) },
    { rotulo: 'fazer um teste', completo: (d) => Boolean(d.temTeste) }
];

// Recebe o documento cru de usuarios/{uid} e devolve se o perfil está
// completo e o que ainda falta (mesmos rótulos da barra de progresso).
export function calcularCompletudePerfil(cadastroDoc) {
    const perfil = { modalidades: [], estilos: [], ...(cadastroDoc?.perfil || {}) };
    const temTeste = Boolean(
        extrairResultadoVocacional(cadastroDoc) || extrairResultadoMaisRecente(cadastroDoc)
    );
    const dados = { cadastro: cadastroDoc || {}, perfil, temTeste };
    const faltando = ITENS_DO_PERFIL.filter((item) => !item.completo(dados)).map((item) => item.rotulo);
    return { completo: faltando.length === 0, faltando };
}
