import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const root = __dirname;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Mirror the tsconfig paths so imports like @/components/... resolve.
      '@': path.resolve(root, 'src'),
      '@wayra/types': path.resolve(root, '../../packages/types/src/index.ts'),
      '@wayra/shared': path.resolve(root, '../../packages/shared/src/index.ts'),
      '@wayra/i18n': path.resolve(root, '../../packages/i18n/src/index.ts'),
      '@wayra/ui': path.resolve(root, '../../packages/ui/src/index.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/components/**', 'src/lib/**', 'src/hooks/**'],
      exclude: ['src/__tests__/**'],
    },
  },
});
