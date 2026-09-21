// Leitura de uma linha de CSV com ponto e vírgula como separador — é o
// formato que as exportações do Centro Paula Souza usam, tanto a de unidades
// quanto a da listagem de cursos.
//
// Respeita aspas: o texto entre aspas pode conter ponto e vírgula, e aspas
// duplicadas ("") viram uma aspa no conteúdo.
export function parseCsvLine(line) {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (inQuotes) {
            if (c === '"') {
                if (line[i + 1] === '"') { cur += '"'; i++; }
                else inQuotes = false;
            } else {
                cur += c;
            }
        } else if (c === '"') {
            inQuotes = true;
        } else if (c === ';') {
            result.push(cur);
            cur = '';
        } else {
            cur += c;
        }
    }
    result.push(cur);
    return result;
}
