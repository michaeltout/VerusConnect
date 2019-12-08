const parseTransactionAddresses = require('agama-wallet-lib/src/transaction-type');

module.exports = (api) => {
  api.parseTransactionAddresses = parseTransactionAddresses;

  return api;
};