// vite.config.ts
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    target: "es2020",
    minify: "esbuild",
    sourcemap: false, // Disable source maps for production
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // More specific chunking strategy
          if (id.includes('pdf-lib') || id.includes('fontkit')) {
            return 'pdf';
          }
          if (id.includes('jszip') || id.includes('file-saver')) {
            return 'zip';
          }
          if (id.includes('comlink')) {
            return 'worker';
          }
          if (id.includes('arabic-reshaper')) {
            return 'text';
          }
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  },

  worker: {
    format: "es",
    rollupOptions: {
      output: {
        // Specific configuration for worker output
        format: 'es',
        manualChunks: undefined, // No chunking in workers
      }
    }
  },

  optimizeDeps: {
    include: [
      'pdf-lib',
      '@pdf-lib/fontkit',
      'arabic-reshaper',
      'comlink'
    ]
  }
});