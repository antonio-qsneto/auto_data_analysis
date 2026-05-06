/* global process */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const devApiProxyTarget = process.env.VITE_DEV_API_PROXY_TARGET || 'http://127.0.0.1:8000';

export default defineConfig({
  plugins: [react()],
  cacheDir: '.vite',
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: devApiProxyTarget,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
