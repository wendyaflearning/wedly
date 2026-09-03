import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

/**
 * Vitest ne lit pas les `paths` du tsconfig : sans cet alias, tout test qui
 * importe un composant échoue à résoudre ses `@/lib/...`. Les tests de `lib/`
 * s'importent en relatif et n'en avaient pas besoin — le premier test de
 * composant, si (WED-161).
 */
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('.', import.meta.url)) },
  },
})
