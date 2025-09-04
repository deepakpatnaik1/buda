/**
 * Recommended ESLint configuration for Essential Boss Rules
 * 
 * This configuration enforces all Boss Rules through automated linting
 */

module.exports = {
  plugins: ['boss'],
  rules: {
    // Rule 7: No hardcoding - All knobs via config bus or env
    'boss/no-hardcoding': ['error', {
      allowedNumbers: [0, 1, -1, 2, 10, 100, 1000],
      allowedStrings: ['', 'test', 'dev', 'prod'],
      ignoreArrayIndexes: true,
      ignoreDefaultValues: true
    }],

    // Rule 3: LEGO placement - Enforce file structure
    'boss/lego-placement': ['error', {
      rootDirs: ['models', 'services', 'ui', 'wire', 'buses'],
      allowedExtensions: {
        models: ['.ts', '.js'],
        services: ['.ts', '.js'],
        ui: ['.svelte', '.ts', '.js'],
        wire: ['.ts', '.js'],
        buses: ['.ts', '.js']
      }
    }],

    // Rule 6: Be Svelte-y - Use idiomatic Svelte patterns
    'boss/be-svelte-y': ['warn', {
      requireTypeScript: true,
      preferReactiveStatements: true,
      requireComponentNaming: true
    }],

    // Rule 5: Thin wrappers only - Bus adapter purity
    'boss/thin-wrapper': ['error', {
      wrapperPatterns: ['wrapper', 'adapter', 'guard', 'logger'],
      maxComplexity: 3
    }]
  },
  
  // Additional ESLint rules that support Boss Rules philosophy
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  
  // Override rules for specific file patterns
  overrides: [
    {
      // More lenient rules for test files
      files: ['**/*.test.*', '**/*.spec.*', '**/tests/**/*'],
      rules: {
        'boss/no-hardcoding': 'off',
        'boss/lego-placement': 'off'
      }
    },
    {
      // Svelte-specific rules
      files: ['**/*.svelte'],
      rules: {
        'boss/be-svelte-y': 'error'
      }
    },
    {
      // Configuration files
      files: ['**/*.config.*', '**/.*rc.*'],
      rules: {
        'boss/no-hardcoding': 'off',
        'boss/lego-placement': 'off',
        'boss/thin-wrapper': 'off'
      }
    }
  ]
};
