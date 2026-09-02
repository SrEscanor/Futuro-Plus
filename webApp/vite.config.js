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
        testes: resolve(__dirname, 'testes.html'),
        cadastro: resolve(__dirname, 'cadastro.html')
      }
    },
    cssCodeSplit: false
  },
  // ...
})