import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Vitest config. The only thing we need beyond the defaults is the `@/` path
 * alias so tests can import modules exactly the way the app does
 * (e.g. `import { createAgentSchema } from "@/lib/schemas"`).
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});
