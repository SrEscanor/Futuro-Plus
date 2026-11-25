import { carregarDocumentoLegal } from './legal-comum.js';
import { PRIVACIDADE_PADRAO } from './conteudo-legal-padrao.js';
import { ativarVLibras } from './vlibras.js';

carregarDocumentoLegal('politica-privacidade', PRIVACIDADE_PADRAO);
ativarVLibras();
