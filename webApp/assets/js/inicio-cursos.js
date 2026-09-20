import { db } from './firebase-config.js';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { renderizarCardUnidade } from './card-unidade.js';

const QUANTIDADE_PREVIA = 4;

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('preview-unidades');
    if (!container) return;

    try {
        // Só a prévia: a página de cursos é quem carrega a lista completa.
        const snap = await getDocs(query(collection(db, 'etecs'), limit(QUANTIDADE_PREVIA)));
        const unidades = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        if (!unidades.length) {
            container.innerHTML = '<p class="sem-resultados">Nenhuma unidade cadastrada ainda.</p>';
            return;
        }

        container.innerHTML = unidades.map((u) => renderizarCardUnidade(u)).join('');
    } catch (err) {
        console.error('Erro ao carregar prévia de unidades:', err);
        container.innerHTML = '<p class="sem-resultados">Não foi possível carregar os cursos agora.</p>';
    }
});
