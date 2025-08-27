import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test files
    include: ['test/**/*.test.js'],
    
    // Environment
    environment: 'node',
    
    // Globals (if you want to use describe/it without imports)
    globals: true,
    
    // Timeout for tests (important for WASM tests)
    testTimeout: 10000,
    
    
    // Mock setup
    setupFiles: [],
    
    // Don't run tests in parallel to avoid WASM conflicts
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    }
  }
});