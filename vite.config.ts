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
    minify: "terser",
    terserOptions: {
      mangle: {
        reserved: ["WE", "OP", "ID", "LE", "GE", "EQ", "NE", "LT", "GT"],
        keep_fnames: true,
      },
      keep_fnames: true,
    } as import("terser").MinifyOptions,

    target: "es2020",
    rollupOptions: {
      output: {
        manualChunks: {
          "pdf-lib": ["pdf-lib"],
        },
      },
    },
  },

  optimizeDeps: {
    exclude: ["pdf-lib", "@pdf-lib/fontkit"],
  },
});