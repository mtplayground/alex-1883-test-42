import mdx from "@mdx-js/rollup";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [mdx({ providerImportSource: "@mdx-js/react" }), react()],
  server: {
    host: "0.0.0.0",
    port: 8080
  },
  preview: {
    host: "0.0.0.0",
    port: 8080
  }
});
