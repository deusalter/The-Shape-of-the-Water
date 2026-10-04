import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Archived review inputs preserve old test sources verbatim; only the live
  // test suite should execute against the current implementation.
  test: { include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'] },
});
