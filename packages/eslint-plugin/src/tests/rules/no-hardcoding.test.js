/**
 * Tests for no-hardcoding rule (Boss Rule 7)
 */

const { RuleTester } = require('eslint');
const rule = require('../../rules/no-hardcoding');

const ruleTester = new RuleTester({
  parserOptions: { ecmaVersion: 2020, sourceType: 'module' }
});

ruleTester.run('no-hardcoding', rule, {
  valid: [
    // Allowed numbers
    'const count = 0;',
    'const initial = 1;',
    'const reset = -1;',
    
    // Config bus usage
    'const timeout = configBus.get("timeout");',
    'const limit = this.configService.getValue("limit");',
    
    // Environment variables
    'const port = process.env.PORT;',
    'const dbUrl = process.env.DATABASE_URL;',
    
    // Array indexes (when ignoreArrayIndexes is true)
    'const first = items[0];',
    'const second = items[1];',
    
    // Default parameters (when ignoreDefaultValues is true)
    'function foo(bar = 42) { return bar; }',
    'const { timeout = 5000 } = options;',
    
    // Allowed strings
    'const empty = "";',
    'const env = "test";',
    
    // Single characters
    'const separator = ",";',
    'const newline = "\\n";'
  ],

  invalid: [
    {
      code: 'const timeout = 5000;',
      errors: [{
        message: "Avoid hardcoded number '5000'. Use config bus or environment variable instead.",
        type: 'Literal'
      }]
    },
    {
      code: 'const pi = 3.14159;',
      errors: [{
        message: "Avoid hardcoded number '3.14159'. Use config bus or environment variable instead.",
        type: 'Literal'
      }]
    },
    {
      code: 'const message = "Hello, World!";',
      errors: [{
        message: "Avoid hardcoded string 'Hello, World!'. Use config bus or environment variable instead.",
        type: 'Literal'
      }]
    },
    {
      code: 'const apiUrl = "https://api.example.com";',
      errors: [{
        message: "Avoid hardcoded string 'https://api.example.com'. Use config bus or environment variable instead.",
        type: 'Literal'
      }]
    },
    {
      code: 'const template = `Welcome to our application`;',
      errors: [{
        message: "Avoid hardcoded template content 'Welcome to our application'. Use config bus or environment variable instead.",
        type: 'TemplateElement'
      }]
    },
    {
      code: 'const retries = 3;',
      errors: [{
        message: "Avoid hardcoded number '3'. Use config bus or environment variable instead.",
        type: 'Literal'
      }]
    }
  ]
});

console.log('✅ no-hardcoding tests passed');
