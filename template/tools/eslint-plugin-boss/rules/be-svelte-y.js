/**
 * Rule: be-svelte-y
 * Boss Rule 6: Be Svelte-y - Use idiomatic Svelte patterns
 * 
 * Enforces Svelte best practices:
 * - TypeScript in script tags (lang="ts")
 * - Reactive statements ($:) over onMount side effects when possible
 * - Proper component naming and structure
 * - Use of Svelte built-ins (bind:, on:, etc.)
 */

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'enforce idiomatic Svelte patterns and TypeScript usage',
      category: 'Boss Rules',
      recommended: true
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          requireTypeScript: {
            type: 'boolean'
          },
          preferReactiveStatements: {
            type: 'boolean'
          },
          requireComponentNaming: {
            type: 'boolean'
          }
        },
        additionalProperties: false
      }
    ]
  },

  create(context) {
    const options = context.options[0] || {};
    const requireTypeScript = options.requireTypeScript !== false;
    const preferReactiveStatements = options.preferReactiveStatements !== false;
    const requireComponentNaming = options.requireComponentNaming !== false;

    const filename = context.getFilename();
    const isSvelteFile = filename.endsWith('.svelte');

    if (!isSvelteFile) {
      return {}; // Only process .svelte files
    }

    let hasTypescriptScript = false;
    let hasOnMountWithSideEffects = false;
    let onMountNodes = [];
    let reactiveStatements = [];

    return {
      // Check script tag attributes
      TaggedTemplateExpression(node) {
        // This won't catch script tags directly, need different approach
      },

      // For Svelte files, we need to analyze the structure differently
      // Since ESLint parses the JS content, we check for script-related patterns
      Program(node) {
        const sourceCode = context.getSourceCode();
        const text = sourceCode.getText();

        // Check if this is a Svelte file and has TypeScript
        if (isSvelteFile) {
          // Check for script tag with TypeScript
          const scriptTagRegex = /<script([^>]*)>/g;
          let match;
          let hasTypescriptLang = false;

          while ((match = scriptTagRegex.exec(text)) !== null) {
            const attributes = match[1];
            if (attributes.includes('lang="ts"') || attributes.includes("lang='ts'")) {
              hasTypescriptLang = true;
              break;
            }
          }

          if (requireTypeScript && !hasTypescriptLang) {
            context.report({
              node,
              message: 'Svelte components should use TypeScript. Add lang="ts" to script tag.',
              fix(fixer) {
                // Try to fix by adding lang="ts" to script tag
                const scriptMatch = text.match(/<script([^>]*)>/);
                if (scriptMatch) {
                  const replacement = scriptMatch[1].trim() 
                    ? `<script${scriptMatch[1]} lang="ts">` 
                    : '<script lang="ts">';
                  return fixer.replaceTextRange([0, text.length], 
                    text.replace(/<script([^>]*)>/, replacement));
                }
              }
            });
          }

          // Check component naming convention (PascalCase)
          if (requireComponentNaming) {
            const baseName = filename.split('/').pop().replace('.svelte', '');
            if (!/^[A-Z][a-zA-Z0-9]*$/.test(baseName)) {
              context.report({
                node,
                message: `Svelte component filename should be PascalCase. Got: ${baseName}`,
              });
            }
          }
        }
      },

      // Check for onMount usage patterns
      CallExpression(node) {
        if (node.callee.name === 'onMount') {
          onMountNodes.push(node);

          // Check if onMount contains side effects that could be reactive
          if (node.arguments.length > 0 && node.arguments[0].type === 'ArrowFunctionExpression') {
            const body = node.arguments[0].body;
            
            // Look for variable assignments or function calls that could be reactive
            if (body.type === 'BlockStatement') {
              const hasAssignments = body.body.some(stmt => 
                stmt.type === 'ExpressionStatement' && 
                stmt.expression.type === 'AssignmentExpression'
              );

              if (hasAssignments && preferReactiveStatements) {
                context.report({
                  node,
                  message: 'Consider using reactive statements ($:) instead of onMount for value assignments.',
                  suggest: [{
                    desc: 'Convert to reactive statement',
                    fix(fixer) {
                      return fixer.insertTextBefore(node, '// TODO: Convert to reactive statement ($:) ');
                    }
                  }]
                });
              }
            }
          }
        }
      },

      // Track reactive statements
      LabeledStatement(node) {
        if (node.label.name === '$') {
          reactiveStatements.push(node);
        }
      },

      // Check for proper Svelte patterns
      AssignmentExpression(node) {
        // Encourage use of bind: directive instead of manual event handling
        if (node.left.type === 'MemberExpression' && 
            node.left.object.name && 
            node.left.property.name === 'value') {
          
          const parent = node.parent;
          if (parent && parent.type === 'ExpressionStatement') {
            context.report({
              node,
              message: 'Consider using bind:value directive instead of manual assignment.',
              suggest: [{
                desc: 'Use bind:value directive',
                fix(fixer) {
                  return fixer.insertTextBefore(node, '// TODO: Replace with bind:value directive ');
                }
              }]
            });
          }
        }
      },

      // End of program - final checks
      'Program:exit'(node) {
        if (isSvelteFile && preferReactiveStatements) {
          // If there are onMount calls but no reactive statements, suggest using reactive patterns
          if (onMountNodes.length > 0 && reactiveStatements.length === 0) {
            context.report({
              node,
              message: 'Consider using reactive statements ($:) for better Svelte patterns.',
            });
          }
        }
      }
    };
  }
};
