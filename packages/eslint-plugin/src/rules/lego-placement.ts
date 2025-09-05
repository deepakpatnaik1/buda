/**
 * Boss Rule #3: LEGO Features
 * 
 * Enforces proper placement of files in the LEGO architecture:
 * models/, services/, ui/, wire/, buses/
 */

import { ESLintUtils } from '@typescript-eslint/utils';
import path from 'path';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/deepakpatnaik1/buda/tree/main/docs/rules/${name}.md`
);

interface Options {
  legoDirectories?: string[];
  exemptPatterns?: string[];
}

export const legoPlacement = createRule<[Options], 'wrongPlacement'>({
  name: 'lego-placement',
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce LEGO architecture file placement - Boss Rule #3',
      recommended: 'error',
    },
    fixable: undefined,
    schema: [
      {
        type: 'object',
        properties: {
          legoDirectories: {
            type: 'array',
            items: { type: 'string' }
          },
          exemptPatterns: {
            type: 'array',
            items: { type: 'string' }
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      wrongPlacement: 'File must be placed in one of the LEGO directories: {{directories}}. Current path: {{currentPath}}'
    }
  },
  defaultOptions: [
    {
      legoDirectories: ['models', 'services', 'ui', 'wire', 'buses'],
      exemptPatterns: [
        'test',
        'spec',
        '__tests__',
        '__mocks__',
        'stories',
        'config',
        'utils',
        'types',
        'constants',
        'main',
        'index',
        'app'
      ]
    }
  ],
  create(context, [options]) {
    const filename = context.getFilename();
    const relativePath = path.relative(process.cwd(), filename);
    
    // Only check files in src/ directory
    if (!relativePath.includes('/src/') && !relativePath.includes('\\src\\')) {
      return {};
    }

    // Check if file matches exempt patterns
    const isExempt = options.exemptPatterns?.some(pattern => {
      const basename = path.basename(filename, path.extname(filename));
      return basename.includes(pattern) || relativePath.includes(pattern);
    });

    if (isExempt) {
      return {};
    }

    // Check if file is in a LEGO directory
    const srcIndex = relativePath.indexOf('/src/') !== -1 ? 
      relativePath.indexOf('/src/') : relativePath.indexOf('\\src\\');
    
    if (srcIndex === -1) return {};

    const pathAfterSrc = relativePath.substring(srcIndex + 5); // +5 for '/src/'
    const firstDirectory = pathAfterSrc.split('/')[0] || pathAfterSrc.split('\\')[0];

    const isInLegoDirectory = options.legoDirectories?.includes(firstDirectory);

    if (!isInLegoDirectory) {
      return {
        Program(node) {
          context.report({
            node,
            messageId: 'wrongPlacement',
            data: {
              directories: options.legoDirectories?.join(', ') || 'models, services, ui, wire, buses',
              currentPath: relativePath
            }
          });
        }
      };
    }

    return {};
  }
});