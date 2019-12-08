const { ethGasStationRateToWei } = require('agama-wallet-lib/src/eth');
const Promise = require('bluebird');
const request = require('request');

// TODO: add to atomic, use individual requests only as a fallback

module.exports = (api) => {
  api.get('/eth/gasprice', (req, res, next) => {
    api._getGasPrice()
    .then((gasprice) => {
      const retObj = {
        msg: gasprice ? 'success' : 'error',
        result: gasprice ? gasprice : 'unable to get gas price',
      };
      res.end(JSON.stringify(retObj));
    });
  });

  api._getGasPrice = () => {
    return new Promise((resolve, reject) => {
      const options = {
        url: 'https://ethgasstation.info/json/ethgasAPI.json',
        method: 'GET',
      };

      api.log('ethgasstation.info gas price req', 'eth.gasprice');

      request(options, (error, response, body) => {
        if (response &&
            response.statusCode &&
            response.statusCode === 200) {
          try {
            const _json = JSON.parse(body);

            if (_json &&
                _json.average &&
                _json.fast &&
                _json.safeLow) {
              api.eth.gasPrice = {
                fast: ethGasStationRateToWei(_json.fast), // 2 min
                average: ethGasStationRateToWei(_json.average),
                slow: ethGasStationRateToWei(_json.safeLow),
              };

              resolve(api.eth.gasPrice);
            } else {
              resolve(false);
            }
          } catch (e) {
            api.log('ethgasstation.info gas price req parse error', 'eth.gasprice');
            api.log(e);
          }
        } else {
          api.log('ethgasstation.info gas price req failed', 'eth.gasprice');
        }
      });
    });
  };

  return api;
};