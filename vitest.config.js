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
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'test/**',
        'scripts/**',
        'examples/**',
        'dist/**',
        'wasm/**',
        'lammps-src/**'
      ]
    },
    
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