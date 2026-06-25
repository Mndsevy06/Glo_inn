import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Charger les variables d'environnement basées sur le mode (development/production)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      port: parseInt(env.VITE_PORT || '5173', 10),
      strictPort: true,
      hmr: {
        overlay: false,
      },
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  };
});
