import { defineConfig } from 'vite';

// GitHub Pages serves the game from /<repo-name>/, local dev from /.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/project-race-against-china/' : '/',
}));
