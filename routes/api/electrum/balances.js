const Promise = require('bluebird');
const { checkTimestamp } = require('agama-wallet-lib/src/time');
const { pubToElectrumScriptHashHex } = require('agama-wallet-lib/src/keys');
const btcnetworks = require('agama-wallet-lib/src/bitcoinjs-networks');
const UTXO_1MONTH_THRESHOLD_SECONDS = 2592000;

module.exports = (api) => {
  api.get('/electrum/get_balances', (req, res, next) => {
    if (!req.query.chainTicker) {
      res.end(JSON.stringify({msg: 'error', result: "No coin passed to electrum get_balances"}));
    }
    const coinLc = req.query.chainTicker.toLowerCase()

    if (!api.electrumKeys[coinLc] || !api.electrumKeys[coinLc].pub) {
      res.end(JSON.stringify({msg: 'error', result: `No address found for ${req.query.chainTicker}`}));
    }
    
    api.electrum.get_balances(api.electrumKeys[coinLc].pub, req.query.chainTicker)
    .then(balanceObj => {
      const retObj = {
        msg: 'success',
        result: {
          native: {
            public: {
              confirmed: balanceObj.confirmed,
              unconfirmed: balanceObj.unconfirmed,
              immature: null,
              interest: balanceObj.interest
            },
            private: {
              confirmed: null
            }
          },
          reserve: {}
        },
      };

      res.end(JSON.stringify(retObj));
    })
    .catch(e => {
      const retObj = {
        msg: 'error',
        result: e.message
      };

      res.end(JSON.stringify(retObj));
    })
  });

  api.electrum.get_balances = (address, coin) => {
    return new Promise(async (resolve, reject) => {
      const network = api.validateChainTicker(coin);
      const ecl = await api.ecl(network);
      const _address = ecl.protocolVersion && ecl.protocolVersion === '1.4' ? pubToElectrumScriptHashHex(address, btcnetworks[network.toLowerCase()] || btcnetworks.kmd) : address;

      api.log('electrum getbalance =>', 'spv.getbalance');
      
      ecl.connect();
      ecl.blockchainAddressGetBalance(_address)
      .then((json) => {
        if (json &&
            json.hasOwnProperty('confirmed') &&
            json.hasOwnProperty('unconfirmed')) {
          if (network === 'komodo' ||
              network.toLowerCase() === 'kmd') {
            ecl.blockchainAddressListunspent(_address)
            .then((utxoList) => {
              if (utxoList &&
                  utxoList.length) {
                // filter out < 10 KMD amounts
                let _utxo = [];
                let utxoIssues = false;
                
                for (let i = 0; i < utxoList.length; i++) {
                  api.log(`utxo ${utxoList[i].tx_hash} sats ${utxoList[i].value} value ${Number(utxoList[i].value) * 0.00000001}`, 'spv.getbalance');

                  if (Number(utxoList[i].value) * 0.00000001 >= 10) {
                    _utxo.push(utxoList[i]);
                  } else {
                    utxoIssues = true;
                  }
                }

                api.log('filtered utxo list =>', 'spv.getbalance');
                api.log(_utxo, 'spv.getbalance');

                if (_utxo &&
                    _utxo.length) {
                  let interestTotal = 0;

                  Promise.all(_utxo.map((_utxoItem, index) => {
                    return new Promise((resolve, reject) => {
                      api.getTransaction(_utxoItem.tx_hash, network, ecl)
                      .then((_rawtxJSON) => {
                        api.log('electrum gettransaction ==>', 'spv.getbalance');
                        api.log((index + ' | ' + (_rawtxJSON.length - 1)), 'spv.getbalance');
                        api.log(_rawtxJSON, 'spv.getbalance');

                        // decode tx
                        const _network = api.getNetworkData(network);
                        let decodedTx;

                        if (api.getTransactionDecoded(_utxoItem.tx_hash, network)) {
                          decodedTx = api.getTransactionDecoded(_utxoItem.tx_hash, network);
                        } else {
                          decodedTx = api.electrumJSTxDecoder(
                            _rawtxJSON,
                            network,
                            _network,
                          );
                          api.getTransactionDecoded(_utxoItem.tx_hash, network, decodedTx);
                        }

                        if (decodedTx &&
                            decodedTx.format &&
                            decodedTx.format.locktime > 0) {
                          interestTotal += api.kmdCalcInterest(
                            decodedTx.format.locktime,
                            _utxoItem.value,
                            _utxoItem.height,
                            true
                          );

                          const _locktimeSec = checkTimestamp(decodedTx.format.locktime * 1000);
                          const interestRulesCheckPass = !decodedTx.format.locktime || Number(decodedTx.format.locktime) === 0 || _locktimeSec > UTXO_1MONTH_THRESHOLD_SECONDS ? false : true;
                          
                          if (!interestRulesCheckPass) {
                            utxoIssues = true;
                          }
                          api.log(`interest ${interestTotal} for txid ${_utxoItem.tx_hash}`, 'interest');
                        }

                        api.log('decoded tx =>', 'spv.getbalance');
                        api.log(decodedTx, 'spv.getbalance');

                        resolve(true);
                      });
                    });
                  }))
                  .then(promiseResult => {
                    ecl.close();

                    resolve({
                      confirmed: Number((0.00000001 * json.confirmed).toFixed(8)),
                      unconfirmed: Number((0.00000001 * json.unconfirmed).toFixed(8)),
                      utxoIssues,
                    });
                  });
                } else {
                  ecl.close();

                  resolve({
                    confirmed: Number((0.00000001 * json.confirmed).toFixed(8)),
                    unconfirmed: Number((0.00000001 * json.unconfirmed).toFixed(8)),
                    interest: 0,
                  })
                }
              } else {
                ecl.close();

                resolve({
                  confirmed: Number((0.00000001 * json.confirmed).toFixed(8)),
                  unconfirmed: Number((0.00000001 * json.unconfirmed).toFixed(8)),
                  interest: 0,
                })
              }
            });
          } else {
            ecl.close();
            api.log('electrum getbalance ==>', 'spv.getbalance');
            api.log(json, 'spv.getbalance');

            resolve({
              confirmed: Number((0.00000001 * json.confirmed).toFixed(8)),
              unconfirmed: Number((0.00000001 * json.unconfirmed).toFixed(8)),
              interest: null,
            })
          }
        } else {
          ecl.close();
          reject(new Error(api.CONNECTION_ERROR_OR_INCOMPLETE_DATA))
        }
      })
      .catch(e => reject(e))
    })
  }

  return api;
};