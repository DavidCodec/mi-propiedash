import { defineConfig } from "vitest/config";
import path from "node:path";

// .mts (no .ts) para que Vite lo cargue como módulo ESM. Con .ts avisa que
// romperá en la próxima versión mayor.
export default defineConfig({
  resolve: {
    // Mismo alias que tsconfig: @/* → src/*
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
