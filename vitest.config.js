import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: ["js/__tests__/**/*.test.js"],
    setupFiles: ["./js/__tests__/setup.js"],
    coverage: {
      provider: "v8",
      include: ["js/**/*.js"],
      exclude: ["js/__tests__/**"],
    },
  },
});
