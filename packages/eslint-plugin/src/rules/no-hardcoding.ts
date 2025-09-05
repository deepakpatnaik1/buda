/**
 * Boss Rule #7: No Hardcoding
 * 
 * Prevents hardcoded values by requiring configuration through
 * ConfigBus or environment variables.
 */

import { ESLintUtils } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/deepakpatnaik1/buda/tree/main/docs/rules/${name}.md`
);

interface Options {
  allowedNumbers?: number[];
  allowedStrings?: string[];
  exemptDirectories?: string[];
}

export const noHardcoding = createRule<[Options], 'hardcodedValue'>({
  name: 'no-hardcoding',
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent hardcoded values - Boss Rule #7',
      recommended: 'warn',
    },
    fixable: undefined,
    schema: [
      {
        type: 'object',
        properties: {
          allowedNumbers: {
            type: 'array',
            items: { type: 'number' }
          },
          allowedStrings: {
            type: 'array', 
            items: { type: 'string' }
          },
          exemptDirectories: {
            type: 'array',
            items: { type: 'string' }
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      hardcodedValue: 'Avoid hardcoded {{type}} "{{value}}". Use ConfigBus or environment variable instead.'
    }
  },
  defaultOptions: [
    {
      allowedNumbers: [0, 1, -1, 2, 3, 4, 5, 8, 10, 20, 24, 32, 50, 100, 120, 1000],
      allowedStrings: [
        '', '\n', ' ', '\t',
        'utf-8', 'utf8',
        'GET', 'POST', 'PUT', 'DELETE', 'PATCH',
        'application/json', 'text/html', 'text/plain',
        'development', 'production', 'test',
        '/', '#', '?', '&', '=',
        'true', 'false', 'null', 'undefined'
      ],
      exemptDirectories: ['tests', 'test', '__tests__', 'spec', '__mocks__']
    }
  ],
  create(context, [options]) {
    const filename = context.getFilename();
    
    // Skip exempt directories
    const isExempt = options.exemptDirectories?.some(dir => 
      filename.includes(`/${dir}/`) || filename.includes(`\\${dir}\\`)
    );
    
    if (isExempt) {
      return {};
    }

    return {
      Literal(node) {
        if (node.value === null || node.value === undefined) {
          return;
        }

        // Check numeric literals
        if (typeof node.value === 'number') {
          if (!options.allowedNumbers?.includes(node.value)) {
            context.report({
              node,
              messageId: 'hardcodedValue',
              data: {
                type: 'number',
                value: String(node.value)
              }
            });
          }
        }

        // Check string literals
        if (typeof node.value === 'string') {
          if (!options.allowedStrings?.includes(node.value)) {
            // Skip very short strings that are likely not configuration
            if (node.value.length <= 2) return;
            
            // Skip strings that look like selectors or technical identifiers
            if (/^[.#]?[a-zA-Z][a-zA-Z0-9_-]*$/.test(node.value)) return;
            
            context.report({
              node,
              messageId: 'hardcodedValue',
              data: {
                type: 'string',
                value: node.value.length > 30 ? `${node.value.slice(0, 30)}...` : node.value
              }
            });
          }
        }
      }
    };
  }
});