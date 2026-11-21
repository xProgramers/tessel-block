import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const CRAZYGAMES_SDK = 'https://sdk.crazygames.com/crazygames-sdk-v3.js';

export default defineConfig(({ mode }) => ({
  // Caminhos relativos: o jogo funciona em qualquer pasta (portais web, WebView do Android)
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    // Build da CrazyGames (`npm run build:crazygames`): injeta o SDK no <head>
    mode === 'crazygames' && {
      name: 'crazygames-sdk',
      transformIndexHtml: () => [{ tag: 'script', attrs: { src: CRAZYGAMES_SDK }, injectTo: 'head-prepend' }],
    },
  ],
  build: {
    outDir: mode === 'crazygames' ? 'dist-crazygames' : 'dist',
  },
  server: { port: 5173, host: true },
  test: { include: ['tests/**/*.test.js'], setupFiles: ['tests/setup.js'] },
}));
