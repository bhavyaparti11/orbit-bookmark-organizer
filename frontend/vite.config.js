import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // During development, send /api requests to the Express server.
    // (In Docker, nginx does the same job — see nginx.conf.)
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
