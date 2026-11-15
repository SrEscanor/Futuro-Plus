// Mini mural da Início: quem está logado e já pendurou certificado vê a
// parede do mural com os 3 mais recentes (2 no celular) e o botão para o
// mural completo. Sem login ou sem certificado, fica o convite de sempre.
// Lê os certificados da própria pessoa: no máximo 20, o limite do mural.
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase-config.js';
import { escapeHtml } from './card-unidade.js';

const QUADROS = 3;
const secao = document.getElementById('mural-mini');
const quadros = document.getElementById('mural-mini-quadros');
const contagem = document.getElementById('mural-mini-contagem');
const convite = document.getElementById('mural-cta');

export function montarMuralMini(certificados) {
    if (!secao || !convite) return;
    const temCertificado = certificados.length > 0;
    secao.hidden = !temCertificado;
    convite.hidden = temCertificado;
    if (!temCertificado) return;

    contagem.textContent = `${certificados.length} certificado${certificados.length > 1 ? 's' : ''} no seu mural`;
    quadros.innerHTML = certificados.slice(0, QUADROS).map((certificado) => `
        <li class="mural-mini-quadro">
            <div class="mural-moldura">
                <img src="${escapeHtml(certificado.url)}" alt="${escapeHtml(certificado.titulo || 'Certificado')}"
                    loading="lazy" decoding="async">
            </div>
        </li>`).join('');
}

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        montarMuralMini([]);
        return;
    }
    try {
        const snap = await getDocs(collection(db, 'usuarios', user.uid, 'certificados'));
        // a mesma ordem do mural: o mais novo primeiro
        const certificados = snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((certificado) => certificado.url)
            .sort((a, b) => (b.criadoEm || '').localeCompare(a.criadoEm || ''));
        montarMuralMini(certificados);
    } catch (erro) {
        console.error('Erro ao carregar o mini mural:', erro);
        montarMuralMini([]);
    }
});
