import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

/**
 * Vitest config:
 *  - `@vitejs/plugin-react` transforms `.tsx` component tests with the React JSX
 *    runtime (tsconfig sets `jsx: "preserve"` for Next, which esbuild alone can't
 *    consume);
 *  - the `@/` path alias so tests import modules exactly the way the app does
 *    (e.g. `import { createAgentSchema } from "@/lib/schemas"`).
 *
 * Component tests opt into a DOM via a `// @vitest-environment jsdom` docblock,
 * keeping the pure-logic suites on the fast default `node` environment.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});
