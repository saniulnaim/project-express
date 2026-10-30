import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Tests run against their own SQLite file so dev.db is never touched.
    env: {
      DATABASE_URL: 'file:./test.db',
      JWT_SECRET: 'test-secret',
    },
    globalSetup: ['./src/tests/global-setup.ts'],
    // All test files share one SQLite database, so run them one at a time.
    fileParallelism: false,
  },
});
