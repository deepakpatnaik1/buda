/**
 * Rule: require-tests
 * Boss Rule 2: Do test-driven development - Always write failing IO-pair tests before implementation
 * 
 * Ensures that new source files have corresponding test files:
 * - .ts/.js files should have .test.ts/.test.js counterparts
 * - Services, models, wire, buses require tests
 * - UI components (.svelte) can be exempted (visual testing complexity)
 */

const fs = require('fs');
const path = require('path');

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'require test files for new source code to enforce TDD',
      category: 'Boss Rules',
      recommended: true
    },
    fixable: null,
    hasSuggestions: true,
    schema: [
      {
        type: 'object',
        properties: {
          testSuffixes: {
            type: 'array',
            items: { type: 'string' }
          },
          exemptDirs: {
            type: 'array', 
            items: { type: 'string' }
          },
          requireForDirs: {
            type: 'array',
            items: { type: 'string' }
          }
        },
        additionalProperties: false
      }
    ]
  },

  create(context) {
    const options = context.options[0] || {};
    const testSuffixes = options.testSuffixes || ['.test.ts', '.test.js', '.spec.ts', '.spec.js'];
    const exemptDirs = new Set(options.exemptDirs || ['tests', 'test', '__tests__', 'node_modules', 'dist', 'build']);
    const requireForDirs = new Set(options.requireForDirs || ['services', 'models', 'wire', 'buses']);

    const filename = context.getFilename();
    const sourceCode = context.getSourceCode();

    // Skip if this is already a test file
    if (testSuffixes.some(suffix => filename.includes(suffix))) {
      return {};
    }

    // Skip if in exempt directory
    const relativePath = path.relative(process.cwd(), filename);
    const pathParts = relativePath.split(path.sep);
    if (pathParts.some(part => exemptDirs.has(part))) {
      return {};
    }

    // Check if this file is in a directory that requires tests
    const requiresTest = pathParts.some(part => requireForDirs.has(part));
    if (!requiresTest) {
      return {}; // Skip files not in critical directories
    }

    /**
     * Check if a test file exists for the given source file
     */
    function findTestFile(sourceFile) {
      const parsed = path.parse(sourceFile);
      const baseDir = parsed.dir;
      const baseName = parsed.name;
      const ext = parsed.ext;

      // Common test file patterns to check
      const testPatterns = [
        // Same directory patterns
        path.join(baseDir, `${baseName}.test${ext}`),
        path.join(baseDir, `${baseName}.spec${ext}`),
        path.join(baseDir, `${baseName}.test.ts`), 
        path.join(baseDir, `${baseName}.spec.ts`),
        
        // Tests subdirectory patterns
        path.join(baseDir, 'tests', `${baseName}.test${ext}`),
        path.join(baseDir, '__tests__', `${baseName}.test${ext}`),
        
        // Parallel tests directory
        path.join(path.dirname(baseDir), 'tests', path.basename(baseDir), `${baseName}.test${ext}`)
      ];

      return testPatterns.find(testPath => {
        try {
          return fs.existsSync(testPath);
        } catch (e) {
          return false;
        }
      });
    }

    /**
     * Generate suggested test file path
     */
    function suggestTestPath(sourceFile) {
      const parsed = path.parse(sourceFile);
      return path.join(parsed.dir, `${parsed.name}.test.ts`);
    }

    /**
     * Check if file contains substantial code (not just imports/types)
     */
    function hasSubstantialCode(node) {
      const program = node;
      if (!program || program.type !== 'Program') return false;
      
      let substantialStatements = 0;
      
      for (const statement of program.body) {
        // Skip only pure import statements and type-only declarations
        if (statement.type === 'ImportDeclaration' || 
            statement.type === 'TSTypeAliasDeclaration' ||
            statement.type === 'TSInterfaceDeclaration' ||
            statement.type === 'TSModuleDeclaration') {
          continue;
        }
        
        // Count functions, classes, variables with implementation
        if (statement.type === 'FunctionDeclaration' ||
            statement.type === 'ClassDeclaration' ||
            statement.type === 'VariableDeclaration') {
          substantialStatements++;
        }

        // Count exported functions and classes
        if (statement.type === 'ExportNamedDeclaration' || 
            statement.type === 'ExportDefaultDeclaration') {
          if (statement.declaration) {
            if (statement.declaration.type === 'FunctionDeclaration' ||
                statement.declaration.type === 'ClassDeclaration' ||
                statement.declaration.type === 'VariableDeclaration') {
              substantialStatements++;
            }
          }
        }
      }
      
      return substantialStatements > 0;
    }

    return {
      'Program:exit'(node) {
        // Only check files with actual implementation code
        if (!hasSubstantialCode(node)) {
          return;
        }

        const testFile = findTestFile(filename);
        
        if (!testFile) {
          const suggestedPath = suggestTestPath(filename);
          const relativeSource = path.relative(process.cwd(), filename);
          const relativeTest = path.relative(process.cwd(), suggestedPath);
          
          context.report({
            node,
            message: `Missing test file for ${relativeSource}. TDD requires tests before implementation.`,
            suggest: [
              {
                desc: `Create test file at ${relativeTest}`,
                fix(fixer) {
                  // We can't actually create files in ESLint, but provide helpful message
                  return null;
                }
              }
            ]
          });
        }
      }
    };
  }
};