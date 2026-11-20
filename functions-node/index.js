// Confere de verdade, no servidor, o que o OCR do navegador (certificado-ocr.js
// e certificado-dados.js, em webApp/assets/js) só confere no computador de
// quem envia: se o nome da conta aparece no certificado e qual unidade (Etec
// ou Fatec) é a dele. Esses dois fatos são o que dá o direito de comentar e
// avaliar como ex-aluno (certificadoDaUnidade, em firestore.rules) — por
// isso não dá para confiar só no que o navegador diz, alguém poderia pular o
// site e escrever esses campos direto no Firestore.
//
// Em Node (e não Python, como o resto de functions/) porque o tesseract.js
// roda via WebAssembly, sem precisar instalar o binário do Tesseract no
// ambiente da função — é o mesmo motor que já roda no navegador, só que
// aqui, sem depender do computador de quem envia.

const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { createWorker } = require('tesseract.js');
const { conferirNome, lerDadosDoCertificado, pareceDiplomaEad, unidadeTemCurso } = require('./certificado-dados');

initializeApp();

// Certificado impresso costuma cortar palavra com hífen no fim da linha
// ("desenvolvi-\nmento") — mesma emenda de certificado-ocr.js, mantida igual
// aqui para o texto ficar igual ao que o navegador já analisou.
function emendarQuebraDeLinha(texto) {
    return (texto || '').replace(/([a-zà-ÿ])-\s*\n\s*([a-zà-ÿ])/gi, '$1$2');
}

async function lerTexto(bytes) {
    const worker = await createWorker('por');
    try {
        const { data } = await worker.recognize(bytes);
        return emendarQuebraDeLinha(data.text || '');
    } finally {
        await worker.terminate();
    }
}

exports.validarCertificado = onDocumentCreated(
    {
        document: 'usuarios/{uid}/certificados/{certificadoId}',
        region: 'southamerica-east1',
        memory: '512MiB',
        timeoutSeconds: 120
    },
    async (event) => {
        const dados = event.data?.data();
        if (!dados?.caminho) return;

        const db = getFirestore();
        const bucket = getStorage().bucket('futuroplus-bce54.firebasestorage.app');

        let bytes;
        try {
            [bytes] = await bucket.file(dados.caminho).download();
        } catch (erro) {
            console.error(`Não consegui baixar o certificado ${dados.caminho}:`, erro);
            return;
        }

        const texto = await lerTexto(bytes);

        const [perfilSnap, cursosSnap, instituicoesSnap] = await Promise.all([
            db.collection('usuarios').doc(event.params.uid).get(),
            db.collection('cursos').get(),
            db.collection('instituicoes').get()
        ]);

        const nomeDaConta = perfilSnap.data()?.nome || '';
        const cursos = cursosSnap.docs.map((d) => ({ id: d.id, nome: d.data().nome || '', nivel: d.data().nivel || '' }));
        const unidades = instituicoesSnap.docs.map((d) => ({
            id: d.id, nome: d.data().nome || '', tipo: d.data().tipo || '', cursos: d.data().cursos || []
        }));

        const nome = conferirNome(texto, nomeDaConta);
        const lido = lerDadosDoCertificado(texto, { cursos, unidades });

        // Diploma de EaD (GEEaD/CETEC): não cita uma unidade específica. Só
        // vale a unidade que a pessoa escolheu no Mural se o curso do
        // diploma bater com o cadastro dela — mesma regra de
        // validarCampos() em mural.js, conferida aqui de novo porque o que
        // o cliente mandou em "unidadeId" não é confiável por si só.
        let unidadeLida = lido.unidade?.id || '';
        if (!unidadeLida && lido.curso && dados.unidadeId && pareceDiplomaEad(texto)) {
            const escolhida = unidades.find((u) => u.id === dados.unidadeId);
            if (escolhida && unidadeTemCurso(escolhida, lido.curso.nome)) unidadeLida = escolhida.id;
        }

        await event.data.ref.update({
            'verificacao.nomeConfere': nome.confere === true,
            'verificacao.unidadeLida': unidadeLida,
            'verificacao.verificadoNoServidorEm': new Date().toISOString()
        });

        console.log(JSON.stringify({
            validacao_certificado: true,
            uid: event.params.uid,
            certificadoId: event.params.certificadoId,
            nomeConfere: nome.confere === true,
            unidadeLida
        }));
    }
);
