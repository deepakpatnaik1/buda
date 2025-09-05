/**
 * Rule: thin-wrapper
 * Boss Rule 5: Thin wrappers only - Adapters around buses for typing, logging, guards
 * 
 * Ensures wrapper/adapter files only contain:
 * - Import statements
 * - Export statements
 * - Type definitions
 * - Simple guard functions
 * - Logging statements
 * 
 * No business logic allowed in wrapper files.
 */

const path = require('path');

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'enforce thin wrapper pattern for bus adapters',
      category: 'Boss Rules',
      recommended: true
    },
    fixable: null,
    schema: [
      {
        type: 'object',
        properties: {
          wrapperPatterns: {
            type: 'array',
            items: { type: 'string' }
          },
          allowedWrapperContent: {
            type: 'array',
            items: { type: 'string' }
          },
          maxComplexity: {
            type: 'number'
          }
        },
        additionalProperties: false
      }
    ]
  },

  create(context) {
    const options = context.options[0] || {};
    const wrapperPatterns = options.wrapperPatterns || ['wrapper', 'adapter', 'guard', 'logger'];
    const allowedWrapperContent = options.allowedWrapperContent || ['import', 'export', 'type', 'interface', 'guard', 'log'];
    const maxComplexity = options.maxComplexity || 3;

    const filename = context.getFilename();
    const basename = path.basename(filename, path.extname(filename)).toLowerCase();
    
    // Check if this file is identified as a wrapper
    const isWrapperFile = wrapperPatterns.some(pattern => basename.includes(pattern));
    
    if (!isWrapperFile) {
      return {}; // Only process wrapper files
    }

    let complexityScore = 0;
    let businessLogicViolations = [];
    let allowedStatements = 0;
    let totalStatements = 0;

    function isAllowedWrapperStatement(node) {
      switch (node.type) {
        case 'ImportDeclaration':
        case 'ExportDefaultDeclaration':
        case 'ExportNamedDeclaration':
        case 'ExportAllDeclaration':
          return true;
        
        case 'TSTypeAliasDeclaration':
        case 'TSInterfaceDeclaration':
        case 'TSEnumDeclaration':
          return true;
          
        case 'VariableDeclaration':
          // Allow simple variable declarations for types or constants
          return node.declarations.every(decl => 
            !decl.init || 
            decl.init.type === 'Literal' || 
            decl.init.type === 'Identifier' ||
            decl.init.type === 'MemberExpression'
          );
          
        case 'FunctionDeclaration':
          // Allow simple guard functions
          if (node.id && node.id.name.toLowerCase().includes('guard')) {
            return node.body.body.length <= 3; // Max 3 statements in guard
          }
          // Allow simple logging functions
          if (node.id && node.id.name.toLowerCase().includes('log')) {
            return node.body.body.length <= 2; // Max 2 statements in logger
          }
          return false;
          
        case 'ExpressionStatement':
          // Allow simple logging calls
          if (node.expression.type === 'CallExpression') {
            const callee = node.expression.callee;
            if (callee.type === 'MemberExpression') {
              const objectName = callee.object.name || '';
              const propertyName = callee.property.name || '';
              return objectName.includes('log') || objectName.includes('console') ||
                     propertyName.includes('log') || propertyName.includes('emit');
            }
          }
          return false;
          
        default:
          return false;
      }
    }

    function calculateComplexity(node) {
      let complexity = 0;
      
      // Add complexity for control flow
      switch (node.type) {
        case 'IfStatement':
        case 'ConditionalExpression':
          complexity += 1;
          break;
        case 'SwitchStatement':
          complexity += 1;
          break;
        case 'ForStatement':
        case 'ForInStatement':
        case 'ForOfStatement':
        case 'WhileStatement':
        case 'DoWhileStatement':
          complexity += 2;
          break;
        case 'TryStatement':
          complexity += 1;
          break;
        case 'LogicalExpression':
          if (node.operator === '&&' || node.operator === '||') {
            complexity += 1;
          }
          break;
      }
      
      return complexity;
    }

    return {
      Program(node) {
        totalStatements = node.body.length;
      },

      // Check each top-level statement
      'Program > *'(node) {
        if (isAllowedWrapperStatement(node)) {
          allowedStatements++;
        } else {
          businessLogicViolations.push({
            node,
            type: node.type,
            message: `Business logic not allowed in wrapper files. Found: ${node.type}`
          });
        }

        // Calculate complexity
        const nodeComplexity = calculateComplexity(node);
        complexityScore += nodeComplexity;
      },

      // Check function bodies for complexity
      FunctionDeclaration(node) {
        let functionComplexity = 0;
        
        function visit(n) {
          functionComplexity += calculateComplexity(n);
          for (const key in n) {
            if (key !== 'parent' && n[key] && typeof n[key] === 'object') {
              if (Array.isArray(n[key])) {
                n[key].forEach(visit);
              } else if (n[key].type) {
                visit(n[key]);
              }
            }
          }
        }
        
        visit(node.body);
        
        if (functionComplexity > maxComplexity) {
          context.report({
            node,
            message: `Function too complex for wrapper file. Complexity: ${functionComplexity}, max allowed: ${maxComplexity}`,
          });
        }
      },

      // Report violations at the end
      'Program:exit'(node) {
        // Report business logic violations
        businessLogicViolations.forEach(violation => {
          context.report({
            node: violation.node,
            message: violation.message,
          });
        });

        // Check overall complexity
        if (complexityScore > maxComplexity) {
          context.report({
            node,
            message: `Wrapper file too complex. Total complexity: ${complexityScore}, max allowed: ${maxComplexity}`,
          });
        }

        // Check ratio of allowed vs disallowed statements
        const allowedRatio = allowedStatements / totalStatements;
        if (allowedRatio < 0.8 && businessLogicViolations.length > 0) {
          context.report({
            node,
            message: `Wrapper file contains too much business logic. ${businessLogicViolations.length} violations found.`,
          });
        }

        // Suggest moving business logic elsewhere
        if (businessLogicViolations.length > 0) {
          context.report({
            node,
            message: 'Consider moving business logic to a service file. Wrappers should only handle typing, logging, and guards.',
          });
        }
      }
    };
  }
};
