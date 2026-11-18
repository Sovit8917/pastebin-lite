import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => ({
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    env: { ...loadEnv(mode, process.cwd(), ""), TEST_MODE: "1" },
    fileParallelism: false,
    testTimeout: 20_000,
  },
}));
