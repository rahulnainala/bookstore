import { defineConfig } from "tsup";

// shared is raw TS, so bundle it in
export default defineConfig({
  entry: {
    index: "src/index.ts",
    migrate: "src/scripts/migrate.ts",
    seed: "src/scripts/seed.ts",
    reset: "src/scripts/reset.ts",
  },
  format: ["esm"],
  platform: "node",
  target: "node22",
  noExternal: ["@bookstore/shared"],
  sourcemap: true,
  clean: true,
});
