import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tsconfigPaths from 'vite-tsconfig-paths'
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@src": path.resolve(__dirname, "src"),
      "@common": path.resolve(__dirname, "../common"),
    },
  },
  plugins: [vue(),tsconfigPaths(),
    {
      name: 'skip-index-file',
      apply: 'build',
      generateBundle(_options, bundle) {
        delete bundle['index.html'];
      }
    },
  ],
  build: {
    outDir: '../dist/view',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: './src/main.ts'
      },
      output: {
        manualChunks: undefined,
        entryFileNames: 'view.bundle.js',
        assetFileNames(chunkInfo) {
          if (chunkInfo?.names?.join('.').endsWith('.css')) {
            return 'view.css';
          }
          return 'assets/[name][ext]';
        },
      }
    },
    assetsDir: 'assets',
    cssCodeSplit: false,
    manifest:false,
    sourcemap:false
  }
})
