import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    root: __dirname,
    include: ['src/__tests__/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@mulligans/api-client': path.resolve(__dirname, 'src/index.ts'),
    },
  },
});
