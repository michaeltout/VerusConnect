const request = require('request');
const Promise = require('bluebird');
const { getRandomIntInclusive } = require('agama-wallet-lib/src/utils');
const { checkTimestamp } = require('agama-wallet-lib/src/time');

let btcFees = {
  recommended: {},
  lastUpdated: null,
};

const BTC_FEES_MIN_ELAPSED_TIME = 120;

module.exports = (api) => {
  api.networkFees['BTC'] = () => {
    return new Promise((resolve, reject) => {
      if (checkTimestamp(btcFees.lastUpdated) > BTC_FEES_MIN_ELAPSED_TIME) {
        const options = {
          url: 'https://bitcoinfees.earn.com/api/v1/fees/recommended',
          method: 'GET',
        };

        request(options, (error, response, body) => {
          if (error != null) reject(error)
          else if (response.statusCode !== 200) reject(new Error("Failed to fetch btc fees"))
          else {
            try {
              const _body = JSON.parse(body)
              const { hourFee, halfHourFee, fastestFee } = _body
  
              resolve({low: hourFee, mid: halfHourFee, max: fastestFee});
            } catch (e) {
              reject(e)
            }
          }
        });
      } else {
        api.log('btcfees, use cache', 'spv.btcFees');
  
        resolve(btcFees)
      }
    });
  }

  return api;
};