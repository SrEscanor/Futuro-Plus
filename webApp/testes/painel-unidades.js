// Monta o painel Admin · Unidades com login e Firestore simulados.
// Uso, a partir de http://localhost:5173/404.html:
//
//     await import('/testes/painel-unidades.js');
//
// O cadastro simulado tem três unidades, e window.teste.enviarCsv() manda um
// CSV de quatro linhas que cobre os casos da prévia:
//   - Etec Alfa: endereço editado à mão (mudou no arquivo), um curso entra e
//     outro sai, e uma rede social que estava vazia
//   - Etec Beta: igual (só a ordem dos campos da direção é diferente)
//   - "Centro Paula Souza Unidade Gama": cadastrada como Fatec, mas o nome não
//     diz o tipo — o tipo não pode ser trocado pelo palpite do arquivo
//   - Fatec Delta: unidade nova
import {
    carregarComSimulacoes, enviarArquivo, iniciarTeste, montarPagina
} from './base.js';

const teste = iniciarTeste();
await montarPagina('/admin-instituicoes.html', 'admin-instituicoes.js');

const TECNICO = 'Cursos Técnicos - Modalidade Presencial';
const vazio = { nome: '', email: '' };

teste.colecoes.instituicoes = new Map([
    ['001', {
        codigo: '001', nome: 'Etec Alfa', tipo: 'Etec', historico: '', cnpj: '', regiao: 'Campinas', municipio: 'Campinas',
        endereco: 'Rua Antiga, 10', site: 'https://alfa.example', aniversarioCidade: '', telefone: '(19) 1111-1111',
        discagemAbreviada: '',
        direcao: { geral: { nome: 'Ana Souza', email: 'ana@etec.sp.gov.br' }, administrativa: vazio, academica: vazio },
        redesSociais: [], documentos: [], logotipoZipUrl: '',
        cursos: [{ categoria: TECNICO, nome: 'Administração' }, { categoria: TECNICO, nome: 'Logística' }],
        camposEditados: ['endereco'], atualizadoPor: 'admin@teste', logotipoUrl: 'https://img.example/alfa.png'
    }],
    ['002', {
        codigo: '002', nome: 'Etec Beta', tipo: 'Etec', historico: '', cnpj: '', regiao: 'Sorocaba', municipio: 'Sorocaba',
        endereco: 'Av. Beta, 20', site: '', aniversarioCidade: '', telefone: '(15) 2222-2222', discagemAbreviada: '',
        direcao: { geral: { email: 'beto@etec.sp.gov.br', nome: 'Beto Lima' }, administrativa: vazio, academica: vazio },
        redesSociais: [], documentos: [], logotipoZipUrl: '', cursos: [{ categoria: TECNICO, nome: 'Química' }]
    }],
    ['300', {
        codigo: '300', nome: 'Centro Paula Souza Unidade Gama', tipo: 'Fatec', historico: '', cnpj: '', regiao: 'Santos',
        municipio: 'Santos', endereco: 'Rua Gama, 30', site: '', aniversarioCidade: '', telefone: '', discagemAbreviada: '',
        direcao: { geral: vazio, administrativa: vazio, academica: vazio }, redesSociais: [], documentos: [],
        logotipoZipUrl: '', cursos: []
    }]
]);

window.confirm = () => true;
await carregarComSimulacoes('/assets/js/admin-instituicoes.js');

// CSV no formato de 17 colunas da exportação de unidades do CPS.
teste.enviarCsv = async () => {
    const aspas = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const linha = (u) => [u.codigo, u.nome, '', '', u.regiao, u.municipio, u.direcao || '', '', '', u.telefone || '', '',
        u.endereco || '', u.site || '', u.redes || '', '', '', u.cursos || ''].map(aspas).join(';');
    const linhas = [
        '"Código";"Unidade";"Histórico";"CNPJ";"Região";"Município";"Direção";"Direção Adm";"Direção Acad";"Telefone";"Aniversário";"Endereço";"Site";"Redes";"Documentos";"Logotipo";"Cursos"',
        linha({
            codigo: '001', nome: 'Etec Alfa', regiao: 'Campinas', municipio: 'Campinas',
            direcao: 'Ana Souza ana@etec.sp.gov.br', telefone: '(19) 1111-1111', endereco: 'Rua Nova, 100',
            site: 'https://alfa.example', redes: 'Instagram: https://instagram.com/etecalfa',
            cursos: 'Cursos Técnicos - Modalidade PresencialAdministraçãoRecursos Humanos'
        }),
        linha({
            codigo: '002', nome: 'Etec Beta', regiao: 'Sorocaba', municipio: 'Sorocaba',
            direcao: 'Beto Lima beto@etec.sp.gov.br', telefone: '(15) 2222-2222', endereco: 'Av. Beta, 20',
            cursos: 'Cursos Técnicos - Modalidade PresencialQuímica'
        }),
        linha({ codigo: '300', nome: 'Centro Paula Souza Unidade Gama', regiao: 'Santos', municipio: 'Santos', endereco: 'Rua Gama, 30' }),
        linha({
            codigo: '004', nome: 'Fatec Delta', regiao: 'Ribeirão Preto', municipio: 'Ribeirão Preto', endereco: 'Rua Delta, 4',
            cursos: 'Cursos Superiores de Tecnologia PresenciaisGestão Empresarial'
        })
    ];
    await enviarArquivo('input-csv', new File([linhas.join('\r\n')], 'unidades.csv', { type: 'text/csv' }));
};

teste.enviarArquivo = enviarArquivo;
teste.texto = (seletor) => document.querySelector(seletor)?.innerText.replace(/\s+/g, ' ') ?? null;
