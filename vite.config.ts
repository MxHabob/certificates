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
    minify: "esbuild",
    target: "es2020",

    rollupOptions: {
      output: {
        manualChunks: {
          "pdf-lib": ["pdf-lib"],
          "pdf-worker": ["./src/lib/pdf/pdf-generator.worker.ts"], // Optional: isolate worker
        },
      },
    },
  },

  optimizeDeps: {
    exclude: ["pdf-lib", "@pdf-lib/fontkit"],
  },
});