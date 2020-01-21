const request = require('request');
const Promise = require('bluebird');
const { checkTimestamp } = require('agama-wallet-lib/src/time');

let coinSupply = {
  result: null,
  lastUpdated: null,
};

const COIN_SUPPLY_MIN_ELAPSED_TIME = 60;

module.exports = (api) => {
  api.coinSupply['VRSC'] = () => {
    return new Promise((resolve, reject) => {
      if (checkTimestamp(coinSupply.lastUpdated) > COIN_SUPPLY_MIN_ELAPSED_TIME) {
        const options = {
          url: 'https://explorer.veruscoin.io/api/coinsupply',
          method: 'GET',
        };

        request(options, (error, response, body) => {
          if (error != null) reject(error)
          else if (response.statusCode !== 200) reject(new Error("Failed to fetch vrsc coin supply"))
          else {
            try {
              const _body = JSON.parse(body)
              resolve(_body);
            } catch (e) {
              reject(e)
            }
          }
        });
      } else {
        api.log('vrsc coinsupply, use cache', 'network.coinSupply');
  
        resolve(coinSupply.result)
      }
    });
  }

  return api;
};