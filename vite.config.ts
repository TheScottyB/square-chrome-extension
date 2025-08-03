import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import { resolve } from 'path';
import manifest from './manifest.json';

export default defineConfig({
  plugins: [
    crx({
      manifest,
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/types': resolve(__dirname, 'src/types'),
      '@/agents': resolve(__dirname, 'src/agents'),
      '@/utils': resolve(__dirname, 'src/utils'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        // The @crxjs/vite-plugin will automatically handle entry points from manifest.json
        // but we can explicitly define them here if needed
      },
    },
  },
  // Ensure compatibility with Chrome extension environment
  define: {
    global: 'globalThis',
  },
});
