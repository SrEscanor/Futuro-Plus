import { carregarDocumentoLegal } from './legal-comum.js';
import { TERMOS_PADRAO } from './conteudo-legal-padrao.js';
import { ativarVLibras } from './vlibras.js';

carregarDocumentoLegal('termos-de-uso', TERMOS_PADRAO);
ativarVLibras();
