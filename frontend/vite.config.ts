import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

const API_TARGET = process.env.VITE_PROXY_TARGET || 'http://localhost:4000';
const APP_BASE = process.env.VITE_APP_BASENAME || '/';

export default defineConfig({
  base: APP_BASE,
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
        proxyTimeout: 180000,
        timeout: 180000,
      },
    },
  },
});
