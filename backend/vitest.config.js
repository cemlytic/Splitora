import { defineConfig } from "vitest/config";

export default defineConfig({
  environments: "node",
  testTimeout: 20000,
  hoookTimeout: 20000,
});
