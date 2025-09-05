const noHardcoding = require('./rules/no-hardcoding');
const legoPlacement = require('./rules/lego-placement');
const beSvelteY = require('./rules/be-svelte-y');
const thinWrapper = require('./rules/thin-wrapper');
const noSilentFailures = require('./rules/no-silent-failures');
const requireTests = require('./rules/require-tests');
const noExpiredFlags = require('./rules/no-expired-flags');
const busDecoupling = require('./rules/bus-decoupling');

module.exports = {
  rules: {
    'no-hardcoding': noHardcoding,
    'lego-placement': legoPlacement,
    'be-svelte-y': beSvelteY,
    'thin-wrapper': thinWrapper,
    'no-silent-failures': noSilentFailures,
    'require-tests': requireTests,
    'no-expired-flags': noExpiredFlags,
    'bus-decoupling': busDecoupling
  },
  configs: {
    recommended: require('./configs/recommended')
  }
};
