/**
 * Rule: no-silent-failures
 * Boss Rule 9: Instrument everything - No silent failures
 * 
 * Detects async functions and Promise operations without error handling:
 * - async functions without try/catch blocks
 * - await expressions without error handling
 * - fetch() calls without .catch() or try/catch
 * - Promise chains without .catch()
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'require error handling for async operations to prevent silent failures',
      category: 'Boss Rules',
      recommended: true
    },
    fixable: null,
    hasSuggestions: true,
    schema: [
      {
        type: 'object',
        properties: {
          allowedAsyncMethods: {
            type: 'array',
            items: { type: 'string' }
          },
          requireTryCatch: {
            type: 'boolean'
          }
        },
        additionalProperties: false
      }
    ]
  },

  create(context) {
    const options = context.options[0] || {};
    const allowedAsyncMethods = new Set(options.allowedAsyncMethods || []);
    const requireTryCatch = options.requireTryCatch !== false;

    // Track async functions and their error handling
    const asyncFunctions = new Map();
    const handledAwaitExpressions = new Set();

    /**
     * Check if a node is within a try-catch block
     */
    function isInTryBlock(node) {
      let parent = node.parent;
      while (parent) {
        if (parent.type === 'TryStatement') {
          return true;
        }
        parent = parent.parent;
      }
      return false;
    }

    /**
     * Check if await expression has error handling
     */
    function hasErrorHandling(awaitNode) {
      // Check if in try-catch
      if (isInTryBlock(awaitNode)) {
        return true;
      }

      // Check if the promise has .catch()
      const parent = awaitNode.parent;
      if (parent && parent.type === 'MemberExpression' && parent.property.name === 'catch') {
        return true;
      }

      // Check if assigned to variable that's later handled
      if (parent && parent.type === 'VariableDeclarator') {
        return false; // For now, we'll be strict - require immediate handling
      }

      return false;
    }

    /**
     * Check if a call expression is a risky async operation
     */
    function isRiskyAsyncCall(node) {
      if (node.type !== 'CallExpression') {
        return false;
      }

      const callee = node.callee;
      
      // Check for fetch() calls
      if (callee.type === 'Identifier' && callee.name === 'fetch') {
        return true;
      }

      // Check for Promise constructor
      if (callee.type === 'Identifier' && callee.name === 'Promise') {
        return true;
      }

      // Check for method calls that return promises
      if (callee.type === 'MemberExpression') {
        const methodName = callee.property.name;
        const riskyMethods = ['then', 'json', 'text', 'arrayBuffer'];
        return riskyMethods.includes(methodName);
      }

      return false;
    }

    /**
     * Check if a promise chain has error handling
     */
    function promiseChainHasErrorHandling(node) {
      // Look for .catch() in the chain
      let current = node;
      while (current && current.type === 'CallExpression') {
        if (current.callee.type === 'MemberExpression') {
          if (current.callee.property.name === 'catch') {
            return true;
          }
        }
        current = current.callee.object;
      }

      // Check if the entire expression is in try-catch
      return isInTryBlock(node);
    }

    return {
      // Track async function declarations
      'FunctionDeclaration[async=true]'(node) {
        asyncFunctions.set(node, {
          hasErrorHandling: false,
          awaitExpressions: []
        });
      },

      // Track async function expressions
      'FunctionExpression[async=true]'(node) {
        asyncFunctions.set(node, {
          hasErrorHandling: false,
          awaitExpressions: []
        });
      },

      // Track async arrow functions
      'ArrowFunctionExpression[async=true]'(node) {
        asyncFunctions.set(node, {
          hasErrorHandling: false,
          awaitExpressions: []
        });
      },

      // Track await expressions
      AwaitExpression(node) {
        // Find the containing async function
        let parent = node.parent;
        let containingAsyncFunction = null;
        
        while (parent) {
          if ((parent.type === 'FunctionDeclaration' || 
               parent.type === 'FunctionExpression' || 
               parent.type === 'ArrowFunctionExpression') && 
              parent.async) {
            containingAsyncFunction = parent;
            break;
          }
          parent = parent.parent;
        }

        if (containingAsyncFunction && asyncFunctions.has(containingAsyncFunction)) {
          asyncFunctions.get(containingAsyncFunction).awaitExpressions.push(node);
          
          // Check if this await has error handling
          if (hasErrorHandling(node)) {
            handledAwaitExpressions.add(node);
            asyncFunctions.get(containingAsyncFunction).hasErrorHandling = true;
          }
        }
      },

      // Check try statements to mark functions as having error handling
      TryStatement(node) {
        // Find containing async function and mark it as having error handling
        let parent = node.parent;
        while (parent) {
          if ((parent.type === 'FunctionDeclaration' || 
               parent.type === 'FunctionExpression' || 
               parent.type === 'ArrowFunctionExpression') && 
              parent.async && asyncFunctions.has(parent)) {
            asyncFunctions.get(parent).hasErrorHandling = true;
            break;
          }
          parent = parent.parent;
        }
      },

      // Check promise chains without await
      CallExpression(node) {
        if (isRiskyAsyncCall(node) && !promiseChainHasErrorHandling(node)) {
          // Skip if this is inside an await expression (handled elsewhere)
          let parent = node.parent;
          let isAwaited = false;
          while (parent) {
            if (parent.type === 'AwaitExpression') {
              isAwaited = true;
              break;
            }
            parent = parent.parent;
          }

          if (!isAwaited) {
            context.report({
              node,
              message: 'Promise-returning call without error handling. Add .catch() or wrap in try-catch.',
              suggest: [
                {
                  desc: 'Add .catch() error handling',
                  fix(fixer) {
                    return fixer.insertTextAfter(node, '.catch(error => console.error(error))');
                  }
                }
              ]
            });
          }
        }
      },

      // Final validation of async functions
      'FunctionDeclaration[async=true]:exit'(node) {
        validateAsyncFunction(node);
      },

      'FunctionExpression[async=true]:exit'(node) {
        validateAsyncFunction(node);
      },

      'ArrowFunctionExpression[async=true]:exit'(node) {
        validateAsyncFunction(node);
      }
    };

    function validateAsyncFunction(node) {
        const functionInfo = asyncFunctions.get(node);
        if (!functionInfo) return;

        const { hasErrorHandling, awaitExpressions } = functionInfo;

        // If function has await expressions but no error handling, report violation
        if (awaitExpressions.length > 0 && !hasErrorHandling && requireTryCatch) {
          const unhandledAwaits = awaitExpressions.filter(await => !handledAwaitExpressions.has(await));
          
          if (unhandledAwaits.length > 0) {
            context.report({
              node,
              message: `Async function contains ${unhandledAwaits.length} await expressions without error handling. Add try-catch block.`,
              suggest: [
                {
                  desc: 'Wrap function body in try-catch',
                  fix(fixer) {
                    const body = node.body;
                    if (body.type === 'BlockStatement') {
                      const bodyText = context.getSourceCode().getText(body);
                      const newBody = `{
  try ${bodyText.slice(1, -1)}
  } catch (error) {
    console.error('Error in ${node.id?.name || 'async function'}:', error);
    throw error;
  }
}`;
                      return fixer.replaceText(body, newBody);
                    }
                  }
                }
              ]
            });
          }
        }
    }
  }
};