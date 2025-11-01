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
      mangle: false, // Completely disable function name mangling
      compress: {
        drop_console: true, // Remove console logs
        drop_debugger: true, // Remove debugger statements
        pure_funcs: ['console.log', 'console.debug'], // Remove specific functions
      },
      format: {
        comments: false, // Remove comments
      },
      keep_classnames: true,
      keep_fnames: true,
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Better chunk splitting for caching
          pdf: ['pdf-lib', '@pdf-lib/fontkit'],
          compression: ['jszip', 'file-saver'],
          worker: ['comlink'],
          text: ['arabic-reshaper'],
          ui: ['react', 'react-dom'],
          utils: ['sonner', 'zustand'],
        }
      }
    }
  },

  worker: {
    format: "es",
    rollupOptions: {
      output: {
        // Ensure worker chunks also don't get mangled
        format: 'es'
      }
    }
  },
});