import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// base './' so the built game loads from a file:// path inside the Electron desktop build.
export default defineConfig({
  base: './',
  plugins: [svelte()],
  test: {
    globals: true,
    include: ['tests/**/*.test.ts'],
    testTimeout: 120_000
  }
});
