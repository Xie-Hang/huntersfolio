import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

// base './' so the built game loads from a file:// path inside the Electron desktop build.
export default defineConfig({
  base: './',
  plugins: [svelte()],
  define: { __APP_VERSION__: JSON.stringify(pkg.version), __HF_EDITION__: JSON.stringify(process.env.HF_EDITION === 'demo' ? 'demo' : 'full') },
  test: {
    globals: true,
    include: ['tests/**/*.test.ts'],
    testTimeout: 120_000
  }
});
