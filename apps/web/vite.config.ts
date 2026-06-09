/// <reference types="vitest" />
import mdx from "@mdx-js/rollup";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [mdx({ providerImportSource: "@mdx-js/react" }), react()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts"
  },
  server: {
    host: "0.0.0.0",
    port: 8080
  },
  preview: {
    host: "0.0.0.0",
    port: 8080
  }
});
