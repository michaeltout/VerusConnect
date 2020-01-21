const Promise = require('bluebird');

module.exports = (api) => {
  api.get_coinsupply = (chainTicker) => {
    if (api.coinSupply[chainTicker] != null) {
      return new Promise(async (resolve, reject) => {
        api.coinSupply[chainTicker]()
        .then(coinSupply => resolve(coinSupply))
        .catch(e => reject(e))
      })
    } else {
      return new Promise((resolve, reject) => reject(new Error(`HTTP/HTTPS coin supply function not found for ${chainTicker}`)))
    }
  }

  return api;
};