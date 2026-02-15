import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  server: {
    host: "0.0.0.0",
    port: 5174,
    allowedHosts: true,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
