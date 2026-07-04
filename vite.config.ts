import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// GitHub Pages serves the game from /<repo-name>/, local dev from /.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/project-race-against-china/' : '/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        booth: resolve(__dirname, 'booth.html'),
      },
    },
  },
}));
