/// <reference types="vitest" />
import { readFile } from "node:fs/promises";

import mdx from "@mdx-js/rollup";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";

const manualRawQuery = "?manual-raw";
const manualRawPrefix = "\0manual-mdx-raw:";

function manualMdxRawPlugin(): Plugin {
  return {
    enforce: "pre" as const,
    name: "manual-mdx-raw",
    async resolveId(source: string, importer: string | undefined) {
      if (!source.endsWith(manualRawQuery)) {
        return null;
      }

      const resolved = await this.resolve(
        source.slice(0, -manualRawQuery.length),
        importer,
        { skipSelf: true }
      );

      return resolved ? `${manualRawPrefix}${resolved.id}` : null;
    },
    async load(id: string) {
      if (!id.startsWith(manualRawPrefix)) {
        return null;
      }

      const filePath = id.slice(manualRawPrefix.length);
      const source = await readFile(filePath, "utf8");

      return `export default ${JSON.stringify(source)};`;
    }
  };
}

export default defineConfig({
  plugins: [
    manualMdxRawPlugin(),
    mdx({ exclude: /\?manual-raw$/, providerImportSource: "@mdx-js/react" }),
    react()
  ],
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
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
