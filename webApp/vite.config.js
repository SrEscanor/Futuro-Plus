import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        quiz: resolve(__dirname, 'quiz-gardner.html'),
        afinidades: resolve(__dirname, 'teste-afinidades.html'),
        testes: resolve(__dirname, 'testes.html'),
        cadastro: resolve(__dirname, 'cadastro.html'),
        adminInstituicoes: resolve(__dirname, 'admin-instituicoes.html'),
        cursos: resolve(__dirname, 'cursos.html'),
        curso: resolve(__dirname, 'curso.html'),
        perfil: resolve(__dirname, 'perfil.html'),
        mural: resolve(__dirname, 'mural.html'),
        vocacional: resolve(__dirname, 'teste-vocacional.html'),
        adminCursos: resolve(__dirname, 'admin-cursos.html'),
        // sem o redirecionamento "tudo para o index", um endereço errado
        // precisa desta página para não cair no 404 genérico do Firebase
        naoEncontrado: resolve(__dirname, '404.html')
      }
    }
  },
  // ...
})