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
    minify: "terser",
    terserOptions: {
      mangle: {
        // Prevent mangling of certain function names
        reserved: ['expose', 'wrap', 'generateAll', 'drawField']
      },
      compress: {
        drop_console: true, // Remove console logs for production
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks for better caching
          pdf: ['pdf-lib', '@pdf-lib/fontkit'],
          utils: ['jszip', 'file-saver', 'comlink'],
          arabic: ['arabic-reshaper']
        }
      }
    }
  },

  worker: {
    format: "es",
  },
});