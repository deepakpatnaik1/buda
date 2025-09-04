import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
  test: {
    // Test environment setup
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    
    // Coverage configuration - Boss Rule 2 (TDD)
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      
      // 90% coverage thresholds as per Boss Rules
      thresholds: {
        lines: 90,
        branches: 85,
        functions: 90,
        statements: 90
      },
      
      // Include all source files for coverage
      include: [
        'src/**/*.{ts,js,svelte}'
      ],
      
      // Exclude test files and config
      exclude: [
        'node_modules/**',
        'dist/**',
        'build/**',
        '**/*.test.{ts,js}',
        '**/*.spec.{ts,js}',
        'tests/**',
        '**/*.config.*',
        'tools/**'
      ]
    },
    
    // File patterns for tests
    include: [
      '**/*.{test,spec}.{js,ts}'
    ],
    
    // Global test configuration
    globals: true,
    
    // Test timeout
    testTimeout: 10000,
    
    // Fail fast on first error for CI
    bail: process.env.CI ? 1 : 0
  },
  
  // Resolve configuration for Svelte components
  resolve: {
    alias: {
      '@': '/src',
    }
  }
});
