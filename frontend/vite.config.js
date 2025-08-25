import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',  // Your Django server URL
        changeOrigin: true,
        secure: false,  // For local dev; set to true in production with HTTPS
      },
    },
  },
});