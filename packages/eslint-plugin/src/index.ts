/**
 * @buda/eslint-plugin - Boss Rules ESLint Plugin
 * 
 * Comprehensive ESLint plugin that enforces all 10 Essential Boss Rules
 * through automated linting and code quality checks.
 */

import { noHardcoding } from './rules/no-hardcoding.js';
import { requireTests } from './rules/require-tests.js';
import { legoPlacement } from './rules/lego-placement.js';
import { busDecoupling } from './rules/bus-decoupling.js';
import { thinWrapper } from './rules/thin-wrapper.js';
import { beSveltey } from './rules/be-sveltey.js';
import { noExpiredFlags } from './rules/no-expired-flags.js';
import { noSilentFailures } from './rules/no-silent-failures.js';

const plugin = {
  meta: {
    name: '@buda/eslint-plugin',
    version: '1.0.0',
    description: 'ESLint plugin enforcing the 10 Essential Boss Rules for BUDA framework'
  },
  rules: {
    // Rule #2: TDD - Test-Driven Development
    'require-tests': requireTests,
    
    // Rule #3: LEGO Features - Modular architecture
    'lego-placement': legoPlacement,
    
    // Rule #4: Decouple with Buses - Bus architecture enforcement
    'bus-decoupling': busDecoupling,
    
    // Rule #5: Thin Wrappers Only - Complexity limits
    'thin-wrapper': thinWrapper,
    
    // Rule #6: Be Framework-Idiomatic - Framework-specific rules
    'be-sveltey': beSveltey,
    
    // Rule #7: No Hardcoding - Configuration enforcement
    'no-hardcoding': noHardcoding,
    
    // Rule #8: Design for Deletion - Deletion readiness
    'no-expired-flags': noExpiredFlags,
    
    // Rule #9: Instrument Everything - Logging and monitoring
    'no-silent-failures': noSilentFailures
  },
  configs: {
    recommended: {
      plugins: ['@buda'],
      rules: {
        '@buda/require-tests': 'error',
        '@buda/lego-placement': 'error', 
        '@buda/bus-decoupling': 'error',
        '@buda/thin-wrapper': 'warn',
        '@buda/be-sveltey': 'warn',
        '@buda/no-hardcoding': 'warn',
        '@buda/no-expired-flags': 'error',
        '@buda/no-silent-failures': 'error'
      }
    },
    strict: {
      plugins: ['@buda'],
      rules: {
        '@buda/require-tests': 'error',
        '@buda/lego-placement': 'error',
        '@buda/bus-decoupling': 'error', 
        '@buda/thin-wrapper': 'error',
        '@buda/be-sveltey': 'error',
        '@buda/no-hardcoding': 'error',
        '@buda/no-expired-flags': 'error',
        '@buda/no-silent-failures': 'error'
      }
    },
    development: {
      plugins: ['@buda'],
      rules: {
        '@buda/require-tests': 'warn',
        '@buda/lego-placement': 'error',
        '@buda/bus-decoupling': 'error',
        '@buda/thin-wrapper': 'warn', 
        '@buda/be-sveltey': 'warn',
        '@buda/no-hardcoding': 'warn',
        '@buda/no-expired-flags': 'warn',
        '@buda/no-silent-failures': 'error'
      }
    }
  }
};

export default plugin;