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
    rollupOptions: {
      output: {
        // Ensure workers are bundled correctly
        manualChunks: undefined,
      },
    },
  },

  worker: {
    format: "es", // Use ES module format for workers
    rollupOptions: {
      output: {
        // Ensure worker chunks are properly formatted
        format: "es",
      },
    },
  },
});