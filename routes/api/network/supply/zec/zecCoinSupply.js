const request = require('request');
const Promise = require('bluebird');
const { checkTimestamp } = require('agama-wallet-lib/src/time');

let coinSupply = {
  result: null,
  lastUpdated: null,
};

const COIN_SUPPLY_MIN_ELAPSED_TIME = 60;

module.exports = (api) => {
  api.coinSupply['ZEC'] = () => {
    return new Promise((resolve, reject) => {
      if (checkTimestamp(coinSupply.lastUpdated) > COIN_SUPPLY_MIN_ELAPSED_TIME) {
        const options = {
          url: 'https://api.zcha.in/v2/mainnet/network',
          method: 'GET',
        };

        request(options, (error, response, body) => {
          if (error != null) reject(error)
          else if (response.statusCode !== 200) reject(new Error("Failed to fetch zec coin supply"))
          else {
            try {
              const _body = JSON.parse(body)

              resolve({ total: _body.totalAmount, private: _body.sproutPool + _body.saplingPool });
            } catch (e) {
              reject(e) 
            }
          }
        });
      } else {
        api.log('zec coinsupply, use cache', 'network.coinSupply');
  
        resolve(coinSupply.result)
      }
    });
  }

  return api;
};