/**
 * Rule: no-hardcoding
 * Boss Rule 7: No hardcoding - All knobs via config bus or env
 * 
 * Prevents magic numbers (except 0, 1) and hardcoded strings (except empty string)
 * Encourages configuration via config bus or environment variables.
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'disallow hardcoded magic numbers and strings',
      category: 'Boss Rules',
      recommended: true
    },
    fixable: null,
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
          ignoreArrayIndexes: {
            type: 'boolean'
          },
          ignoreDefaultValues: {
            type: 'boolean'
          }
        },
        additionalProperties: false
      }
    ]
  },

  create(context) {
    const options = context.options[0] || {};
    const allowedNumbers = new Set(options.allowedNumbers || [0, 1, -1]);
    const allowedStrings = new Set(options.allowedStrings || ['', 'test']);
    const ignoreArrayIndexes = options.ignoreArrayIndexes !== false;
    const ignoreDefaultValues = options.ignoreDefaultValues !== false;

    function isConfigBusCall(node, parent) {
      // Check if this literal is an argument to a config bus call
      if (!parent || parent.type !== 'CallExpression' || !parent.callee) {
        return false;
      }
      
      const callee = parent.callee;
      if (callee.type !== 'MemberExpression') {
        return false;
      }
      
      // Handle direct references like configBus.get()
      if (callee.object.name) {
        const objName = callee.object.name;
        return objName.includes('config') || objName.includes('Config');
      }
      
      // Handle this.configService.getValue() patterns
      if (callee.object.type === 'MemberExpression' &&
          callee.object.object && 
          callee.object.object.type === 'ThisExpression' &&
          callee.object.property && 
          callee.object.property.name) {
        const serviceName = callee.object.property.name;
        return serviceName.includes('config') || serviceName.includes('Config');
      }
      
      return false;
    }

    function isEnvironmentVariable(node) {
      // Check if this is process.env.SOMETHING
      return node.type === 'MemberExpression' &&
        node.object.type === 'MemberExpression' &&
        node.object.object.name === 'process' &&
        node.object.property.name === 'env';
    }

    function isArrayIndex(node, parent) {
      return ignoreArrayIndexes &&
        parent.type === 'MemberExpression' &&
        parent.computed &&
        parent.property === node;
    }

    function isDefaultParameter(node, parent) {
      return ignoreDefaultValues &&
        parent.type === 'AssignmentPattern' &&
        parent.right === node;
    }

    return {
      Literal(node) {
        const { value } = node;
        const parent = node.parent;

        // Skip if this is part of a config bus call or env var
        if (isConfigBusCall(node, parent) || isEnvironmentVariable(parent)) {
          return;
        }

        // Skip array indexes and default parameters if configured
        if (isArrayIndex(node, parent) || isDefaultParameter(node, parent)) {
          return;
        }

        // Check magic numbers
        if (typeof value === 'number' && !allowedNumbers.has(value)) {
          context.report({
            node,
            message: `Avoid hardcoded number '${value}'. Use config bus or environment variable instead.`,
            data: { value }
          });
        }

        // Check magic strings
        if (typeof value === 'string' && !allowedStrings.has(value)) {
          // Allow short strings (single characters, common keywords)
          if (value.length > 1 && !['true', 'false', 'null', 'undefined'].includes(value)) {
            context.report({
              node,
              message: `Avoid hardcoded string '${value}'. Use config bus or environment variable instead.`,
              data: { value }
            });
          }
        }
      },

      TemplateElement(node) {
        // Check template literal content
        const value = node.value.raw;
        if (value.length > 1 && !allowedStrings.has(value)) {
          context.report({
            node,
            message: `Avoid hardcoded template content '${value}'. Use config bus or environment variable instead.`,
            data: { value }
          });
        }
      }
    };
  }
};
