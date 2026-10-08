import { defineConfig } from "tsup";

// Bundle the server and the DB scripts. The workspace package @bookstore/shared ships as
// TypeScript source, so it is inlined; real npm dependencies stay external.
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
