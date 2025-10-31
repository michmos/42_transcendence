import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    environment: 'node',
    pool: 'forks',
    fileParallelism: false, // required to avoid race conditions between testfiles
    setupFiles: ['./test/setup.ts'],
  },
});
