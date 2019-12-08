const kmdCalcInterest = require('agama-wallet-lib/src/komodo-interest');

module.exports = (api) => {
  api.kmdCalcInterest = kmdCalcInterest;

  return api;
};