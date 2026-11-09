import { defineConfig } from 'vite';

export default defineConfig({
  // Caminho relativo: funciona no GitHub Pages em qualquer nome de repositório.
  base: './',
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1500,
  },
  server: {
    port: 5173,
  },
});
