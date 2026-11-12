// Resumo da demanda (inscritos por vaga) de um curso, a partir do que a
// função coletar_demanda grava em cursos/{id}.demanda:
//   { historico: [{ periodo: "2026-1", inscritos, vagas, unidades }], atualizadoEm }
// Usado pela página do curso e pela tabela do painel admin.

// Faixas definidas com os números reais do 1º semestre de 2026: no estado
// todo, o curso mais disputado das Etecs teve 4,8 candidatos por vaga, e um
// terço dos cursos ficou abaixo de 1,5.
const NIVEIS = [
    { minimo: 3, chave: 'alta', rotulo: 'Alta demanda', descricao: 'Curso muito procurado no estado.' },
    { minimo: 1.5, chave: 'media', rotulo: 'Demanda média', descricao: 'Procura equilibrada com o número de vagas.' },
    { minimo: 0, chave: 'baixa', rotulo: 'Baixa demanda', descricao: 'Costuma ter vaga para quase todos os inscritos.' }
];

export function nivelDaDemanda(porVaga) {
    return NIVEIS.find((nivel) => porVaga >= nivel.minimo);
}

export function formatarPorVaga(porVaga) {
    return porVaga.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

// Devolve null quando o curso ainda não tem demanda coletada.
export function resumoDaDemanda(demanda) {
    const historico = (demanda?.historico || [])
        .filter((h) => h?.periodo && h.vagas > 0)
        .map((h) => {
            const [ano, semestre] = h.periodo.split('-').map(Number);
            const porVaga = h.inscritos / h.vagas;
            return { ...h, ano, semestre, porVaga, porVagaTexto: formatarPorVaga(porVaga) };
        })
        .sort((a, b) => a.periodo.localeCompare(b.periodo));

    if (!historico.length) return null;

    // O gráfico compara o 1º semestre de cada ano; se só houver 2º semestre
    // coletado, vale ele mesmo.
    const primeiros = historico.filter((h) => h.semestre === 1);
    const serie = primeiros.length ? primeiros : historico;
    const atual = serie[serie.length - 1];

    return {
        ...atual,
        nivel: nivelDaDemanda(atual.porVaga),
        serie
    };
}
