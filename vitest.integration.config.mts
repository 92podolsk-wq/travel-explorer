import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.integration.test.ts"],
    setupFiles: ["./vitest.integration.setup.mts"],
    fileParallelism: false
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src")
    }
  }
});
