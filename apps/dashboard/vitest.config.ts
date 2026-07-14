import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    root: __dirname,
    include: ['src/__tests__/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@mulligans/api-client': path.resolve(__dirname, '../../packages/api-client/src/index.ts'),
    },
  },
});
