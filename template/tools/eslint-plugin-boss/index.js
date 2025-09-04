const noHardcoding = require('./rules/no-hardcoding');
const legoPlacement = require('./rules/lego-placement');
const beSvelteY = require('./rules/be-svelte-y');
const thinWrapper = require('./rules/thin-wrapper');

module.exports = {
  rules: {
    'no-hardcoding': noHardcoding,
    'lego-placement': legoPlacement,
    'be-svelte-y': beSvelteY,
    'thin-wrapper': thinWrapper
  },
  configs: {
    recommended: require('./configs/recommended')
  }
};
