import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    // Default stays "node" for the existing pure-logic/repository tests.
    // Component/hook tests opt into jsdom per-file via a
    // `// @vitest-environment jsdom` docblock at the top of the test file
    // (vitest 4 dropped the old `environmentMatchGlobs` config option).
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    exclude: ["src/**/*.integration.test.ts", "node_modules/**"]
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src")
    }
  }
});
