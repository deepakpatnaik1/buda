/**
 * Rule: lego-placement
 * Boss Rule 3: LEGO features - Each feature = data model + service + UI component + coordinator wiring
 * 
 * Enforces that files are placed in correct directories according to LEGO architecture:
 * - models/ for data models
 * - services/ for business logic services  
 * - ui/ for UI components
 * - wire/ for coordinator wiring
 * - buses/ for event/state/config/error buses
 */

const path = require('path');

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'enforce LEGO architecture file placement',
      category: 'Boss Rules',
      recommended: true
    },
    fixable: null,
    schema: [
      {
        type: 'object',
        properties: {
          rootDirs: {
            type: 'array',
            items: { type: 'string' }
          },
          allowedExtensions: {
            type: 'object',
            additionalProperties: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        },
        additionalProperties: false
      }
    ]
  },

  create(context) {
    const options = context.options[0] || {};
    const rootDirs = options.rootDirs || ['models', 'services', 'ui', 'wire', 'buses'];
    const allowedExtensions = options.allowedExtensions || {
      models: ['.ts', '.js'],
      services: ['.ts', '.js'],
      ui: ['.svelte', '.ts', '.js'],
      wire: ['.ts', '.js'],
      buses: ['.ts', '.js']
    };

    const filename = context.getFilename();
    const relativePath = path.relative(process.cwd(), filename);
    const pathParts = relativePath.split(path.sep);

    function getLegoCategory(filePath) {
      // Find which LEGO category this file belongs to
      for (const part of pathParts) {
        if (rootDirs.includes(part)) {
          return part;
        }
      }
      return null;
    }

    function isValidExtensionForCategory(category, filePath) {
      const ext = path.extname(filePath);
      const allowed = allowedExtensions[category] || [];
      return allowed.includes(ext);
    }

    function isTestFile(filePath) {
      return filePath.includes('.test.') || filePath.includes('.spec.') || filePath.includes('__tests__');
    }

    function isConfigFile(filePath) {
      const configFiles = ['eslintrc', 'vite.config', 'svelte.config', 'tsconfig', 'package.json'];
      return configFiles.some(config => path.basename(filePath).includes(config));
    }

    return {
      Program(node) {
        // Skip test files and config files
        if (isTestFile(filename) || isConfigFile(filename)) {
          return;
        }

        // Skip files in node_modules or dist directories
        if (filename.includes('node_modules') || filename.includes('dist') || filename.includes('build')) {
          return;
        }

        // Skip files not in src directory (assuming src/ contains the LEGO structure)
        if (!filename.includes('src')) {
          return;
        }

        const category = getLegoCategory(filename);

        // Check if file is in a LEGO directory
        if (!category) {
          // Only report if this is clearly a source file that should be categorized
          const ext = path.extname(filename);
          if (['.ts', '.js', '.svelte'].includes(ext) && !filename.includes('main.ts') && !filename.includes('app.')) {
            context.report({
              node,
              message: `File must be placed in one of the LEGO directories: ${rootDirs.join(', ')}. Current path: ${relativePath}`,
            });
          }
          return;
        }

        // Check if file extension is valid for its category
        if (!isValidExtensionForCategory(category, filename)) {
          context.report({
            node,
            message: `File extension not allowed in ${category}/. Allowed extensions: ${allowedExtensions[category].join(', ')}`,
          });
        }

        // Additional semantic checks based on category
        if (category === 'models' && !filename.toLowerCase().includes('model')) {
          context.report({
            node,
            message: 'Files in models/ should include "Model" in the filename (e.g., UserModel.ts)',
          });
        }

        if (category === 'services' && !filename.toLowerCase().includes('service')) {
          context.report({
            node,
            message: 'Files in services/ should include "Service" in the filename (e.g., UserService.ts)',
          });
        }

        if (category === 'wire' && !filename.toLowerCase().includes('wire')) {
          context.report({
            node,
            message: 'Files in wire/ should include "Wire" in the filename (e.g., UserWire.ts)',
          });
        }

        if (category === 'buses' && !filename.toLowerCase().includes('bus')) {
          context.report({
            node,
            message: 'Files in buses/ should include "Bus" in the filename (e.g., EventBus.ts)',
          });
        }
      }
    };
  }
};
