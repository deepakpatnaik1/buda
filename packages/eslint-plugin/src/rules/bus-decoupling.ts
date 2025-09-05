/**
 * Boss Rule #4: Decouple with Buses
 * 
 * Prevents cross-bus logic and ensures components communicate
 * only through the designated 4-bus architecture.
 */

import { ESLintUtils } from '@typescript-eslint/utils';
import { TSESTree } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/deepakpatnaik1/buda/tree/main/docs/rules/${name}.md`
);

interface Options {
  busNames?: string[];
  allowedCrossBus?: string[];
}

export const busDecoupling = createRule<[Options], 'crossBusLogic'>({
  name: 'bus-decoupling',
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent cross-bus logic - Boss Rule #4',
      recommended: 'error',
    },
    fixable: undefined,
    schema: [
      {
        type: 'object',
        properties: {
          busNames: {
            type: 'array',
            items: { type: 'string' }
          },
          allowedCrossBus: {
            type: 'array',
            items: { type: 'string' }
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      crossBusLogic: 'Component uses multiple buses ({{buses}}). Rule #4: Use pub/sub only, no cross-bus logic.'
    }
  },
  defaultOptions: [
    {
      busNames: ['EventBus', 'StateBus', 'ConfigBus', 'ErrorBus'],
      allowedCrossBus: ['ErrorBus'] // ErrorBus can be used with others for error handling
    }
  ],
  create(context, [options]) {
    const usedBuses = new Set<string>();

    function checkForMultipleBuses(node: TSESTree.Node) {
      const buses = new Set<string>();
      const visited = new WeakSet<TSESTree.Node>();

      function traverse(currentNode: TSESTree.Node) {
        if (visited.has(currentNode)) return;
        visited.add(currentNode);

        // Check for bus usage in member expressions
        if (currentNode.type === 'MemberExpression') {
          const objectName = getObjectName(currentNode);
          if (objectName && options.busNames?.includes(objectName)) {
            buses.add(objectName);
          }
        }

        // Check for bus imports
        if (currentNode.type === 'ImportSpecifier' || currentNode.type === 'ImportDefaultSpecifier') {
          const importName = currentNode.local.name;
          if (options.busNames?.includes(importName)) {
            buses.add(importName);
          }
        }

        // Recursively check child nodes (excluding parent property to prevent cycles)
        for (const [key, value] of Object.entries(currentNode)) {
          if (key === 'parent') continue;
          
          if (Array.isArray(value)) {
            value.forEach(child => {
              if (child && typeof child === 'object' && 'type' in child) {
                traverse(child as TSESTree.Node);
              }
            });
          } else if (value && typeof value === 'object' && 'type' in value) {
            traverse(value as TSESTree.Node);
          }
        }
      }

      traverse(node);
      return buses;
    }

    function getObjectName(node: TSESTree.MemberExpression): string | null {
      if (node.object.type === 'Identifier') {
        return node.object.name;
      }
      return null;
    }

    return {
      Program(node) {
        const buses = checkForMultipleBuses(node);
        
        if (buses.size > 1) {
          // Filter out allowed cross-bus combinations
          const filteredBuses = Array.from(buses).filter(bus => 
            !options.allowedCrossBus?.includes(bus)
          );

          if (filteredBuses.length > 1) {
            context.report({
              node,
              messageId: 'crossBusLogic',
              data: {
                buses: Array.from(buses).join(', ')
              }
            });
          }
        }
      },

      CallExpression(node) {
        // Track bus method calls
        if (node.callee.type === 'MemberExpression') {
          const objectName = getObjectName(node.callee);
          if (objectName && options.busNames?.includes(objectName)) {
            usedBuses.add(objectName);
          }
        }
      },

      VariableDeclarator(node) {
        // Track bus assignments
        if (node.init?.type === 'MemberExpression') {
          const objectName = getObjectName(node.init);
          if (objectName && options.busNames?.includes(objectName)) {
            usedBuses.add(objectName);
          }
        }
      }
    };
  }
});