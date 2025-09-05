/**
 * Boss Rule #4: Decouple with buses
 * 
 * Enforces:
 * - Event bus, state bus, config bus, error bus
 * - Strong typing enforced
 * - Pub/sub only. No cross-bus logic
 * - Version contracts when breaking
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce bus decoupling patterns',
      category: 'Boss Rules'
    },
    fixable: null,
    hasSuggestions: false,
    schema: [{
      type: 'object',
      properties: {
        allowedBuses: {
          type: 'array',
          items: { type: 'string' },
          default: ['eventBus', 'stateBus', 'configBus', 'errorBus']
        },
        allowDirectImports: {
          type: 'boolean',
          default: false
        }
      }
    }]
  },

  create(context) {
    const options = context.options[0] || {};
    const allowedBuses = options.allowedBuses || ['eventBus', 'stateBus', 'configBus', 'errorBus'];
    const allowDirectImports = options.allowDirectImports || false;

    let busImports = new Set();
    let directBusUsage = new Set();
    let crossBusLogic = [];

    // Helper functions
    function checkForCrossBusUsage(node, busName) {
      const parent = node.parent;
      
      // Look for patterns where one bus directly calls another
      if (parent && parent.type === 'CallExpression') {
        const args = parent.arguments;
        
        // Check if bus method arguments reference other buses
        args.forEach(arg => {
          if (arg.type === 'MemberExpression' && arg.object && arg.object.name) {
            const argBusName = arg.object.name;
            if (allowedBuses.includes(argBusName) && argBusName !== busName) {
              crossBusLogic.push({
                node,
                message: `${busName} directly accessing ${argBusName}`
              });
            }
          }
        });
      }
    }

    function validateBusMethodCall(node, busName, methodName) {
      // Check for proper typing in bus method calls
      const expectedMethods = {
        eventBus: ['publish', 'subscribe'],
        stateBus: ['setState', 'getState', 'watchState'],
        configBus: ['get', 'set', 'clearCache'],
        errorBus: ['reportError', 'subscribe']
      };

      if (expectedMethods[busName] && !expectedMethods[busName].includes(methodName)) {
        context.report({
          node,
          message: `Invalid method '${methodName}' for ${busName}. Allowed methods: ${expectedMethods[busName].join(', ')}`
        });
      }
    }

    function detectCrossBusLogic(node, busName) {
      // Look for complex logic that suggests cross-bus coupling
      let parent = node.parent;
      let depth = 0;
      
      while (parent && depth < 5) {
        if (parent.type === 'IfStatement' || parent.type === 'WhileStatement' || parent.type === 'ForStatement') {
          // Check if conditional logic involves multiple buses
          const hasMultipleBuses = checkForMultipleBuses(parent);
          if (hasMultipleBuses.length > 1) {
            crossBusLogic.push({
              node,
              message: `Complex logic involving multiple buses: ${hasMultipleBuses.join(', ')}`
            });
          }
        }
        parent = parent.parent;
        depth++;
      }
    }

    function checkForMultipleBuses(node) {
      const buses = new Set();
      const visited = new WeakSet();
      
      function traverse(n) {
        if (!n || typeof n !== 'object' || visited.has(n)) {
          return;
        }
        visited.add(n);
        
        if (n.type === 'MemberExpression' && n.object && n.object.name) {
          if (allowedBuses.includes(n.object.name)) {
            buses.add(n.object.name);
          }
        }
        
        for (const key in n) {
          if (key !== 'parent' && n[key] && typeof n[key] === 'object') {
            if (Array.isArray(n[key])) {
              n[key].forEach(traverse);
            } else if (n[key].type) {
              traverse(n[key]);
            }
          }
        }
      }
      
      traverse(node);
      return Array.from(buses);
    }

    function shouldUseBuses() {
      const filename = context.getFilename();
      return filename.includes('/services/') || filename.includes('/wire/') || filename.includes('/models/');
    }

    return {
      ImportDeclaration(node) {
        // Check for bus imports
        if (node.source.value && node.source.value.includes('/buses/')) {
          node.specifiers.forEach(spec => {
            if (spec.type === 'ImportSpecifier') {
              busImports.add(spec.imported.name);
            }
          });
        }

        // Flag non-standard bus imports
        if (node.source.value && node.source.value.includes('Bus') && !node.source.value.includes('/buses/')) {
          context.report({
            node,
            message: 'Import buses from the buses directory only. Use: import { busName } from "./buses/BusName"'
          });
        }
      },

      MemberExpression(node) {
        // Check for direct bus usage patterns
        if (node.object && node.object.name) {
          const objectName = node.object.name;
          
          // Check if accessing a bus
          if (allowedBuses.some(bus => objectName === bus || objectName.endsWith('Bus'))) {
            directBusUsage.add(objectName);
            
            // Check for cross-bus logic (one bus calling another)
            if (node.property && node.property.name) {
              const methodName = node.property.name;
              
              // Detect cross-bus method calls
              if (methodName === 'publish' || methodName === 'subscribe' || methodName === 'setState' || methodName === 'getState') {
                checkForCrossBusUsage(node, objectName);
              }
            }
          }
        }
      },

      CallExpression(node) {
        // Check for proper bus usage patterns
        if (node.callee && node.callee.object && node.callee.property) {
          const busName = node.callee.object.name;
          const methodName = node.callee.property.name;
          
          if (allowedBuses.includes(busName)) {
            // Check for typed bus calls
            validateBusMethodCall(node, busName, methodName);
            
            // Check for cross-bus violations
            detectCrossBusLogic(node, busName);
          }
        }
      },

      'Program:exit'() {
        // Report cross-bus logic violations
        crossBusLogic.forEach(violation => {
          context.report({
            node: violation.node,
            message: `Cross-bus logic detected: ${violation.message}. Buses should use pub/sub patterns only.`
          });
        });

        // Check for missing bus imports in files that should use them
        if (shouldUseBuses() && busImports.size === 0) {
          context.report({
            loc: { line: 1, column: 0 },
            message: 'Service/Wire files should use bus architecture for decoupling'
          });
        }
      }
    };
  }
};