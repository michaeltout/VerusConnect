const request = require('request');
const Promise = require('bluebird');
const { getRandomIntInclusive } = require('agama-wallet-lib/src/utils');
const { checkTimestamp } = require('agama-wallet-lib/src/time');

let btcFeeBlocks = [];

for (let i = 0; i < 25; i++) {
  btcFeeBlocks.push(i);
}

let btcFees = {
  recommended: {},
  all: {},
  electrum: {},
  lastUpdated: null,
};

const BTC_FEES_MIN_ELAPSED_TIME = 120;

module.exports = (api) => {
  api.get('/electrum/btcfees', (req, res, next) => {
    if (api.checkToken(req.query.token)) {
      if (checkTimestamp(btcFees.lastUpdated) > BTC_FEES_MIN_ELAPSED_TIME) {
        async function _btcFees() {
          const _randomServer = api.electrumServers.btc.serverList[getRandomIntInclusive(0, api.electrumServers.btc.serverList.length - 1)].split(':');
          const ecl = await api.ecl(network, {
            port: _randomServer[1],
            ip: _randomServer[0],
            port: 'tcp',
          });
          let _btcFeeEstimates = [];

          api.log(`btc fees server ${_randomServer.join(':')}`, 'spv.btcFees');

          ecl.connect();
          Promise.all(btcFeeBlocks.map((coin, index) => {
            return new Promise((resolve, reject) => {
              ecl.blockchainEstimatefee(index + 1)
              .then((json) => {
                resolve(true);

                if (json > 0) {
                  _btcFeeEstimates.push(Math.floor((json / 1024) * 100000000));
                }
              });
            });
          }))
          .then(result => {
            ecl.close();

            const options = {
              url: 'https://bitcoinfees.earn.com/api/v1/fees/recommended',
              method: 'GET',
            };
            btcFees.electrum = result && result.length ? _btcFeeEstimates : 'error';

            // send back body on both success and error
            // this bit replicates iguana core's behaviour
            request(options, (error, response, body) => {
              if (response &&
                  response.statusCode &&
                  response.statusCode === 200) {
                try {
                  const _parsedBody = JSON.parse(body);
                  btcFees.lastUpdated = Math.floor(Date.now() / 1000);
                  btcFees.recommended = _parsedBody;
                } catch (e) {
                  api.log('unable to retrieve BTC fees / recommended', 'spv.btcFees');
                }
              } else {
                api.log('unable to retrieve BTC fees / recommended', 'spv.btcFees');
              }

              const retObj = {
                msg: 'success',
                result: btcFees,
              };
              res.end(JSON.stringify(retObj));
            });
          });
        };
        _btcFees();
      } else {
        api.log('btcfees, use cache', 'spv.btcFees');

        const retObj = {
          msg: 'success',
          result: btcFees,
        };

        res.end(JSON.stringify(retObj));
      }
    } else {
      const retObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(retObj));
    }
  });

  return api;
};