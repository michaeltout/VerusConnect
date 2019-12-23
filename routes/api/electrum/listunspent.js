// TODO: watchonly spendable switch

const Promise = require('bluebird');
const { checkTimestamp } = require('agama-wallet-lib/src/time');
const { pubToElectrumScriptHashHex } = require('agama-wallet-lib/src/keys');
const btcnetworks = require('agama-wallet-lib/src/bitcoinjs-networks');
const UTXO_1MONTH_THRESHOLD_SECONDS = 2592000;

module.exports = (api) => {
  api.electrum.listunspent = (ecl, address, network, full, verify) => {
    const _address = ecl.protocolVersion && ecl.protocolVersion === '1.4' ? pubToElectrumScriptHashHex(address, btcnetworks[network.toLowerCase()] || btcnetworks.kmd) : address;
    let _atLeastOneDecodeTxFailed = false;

    if (full &&
        !ecl.insight) {
      return new Promise((resolve, reject) => {
        ecl.connect();
        ecl.blockchainAddressListunspent(_address)
        .then((_utxoJSON) => {
          if (_utxoJSON &&
              _utxoJSON.length) {
            let formattedUtxoList = [];
            let _utxo = [];

            api.electrumGetCurrentBlock(network)
            .then((currentHeight) => {
              if (currentHeight &&
                  Number(currentHeight) > 0) {
                // filter out unconfirmed utxos
                for (let i = 0; i < _utxoJSON.length; i++) {
                  if (Number(currentHeight) - Number(_utxoJSON[i].height) !== 0) {
                    _utxo.push(_utxoJSON[i]);
                  }
                }

                if (!_utxo.length) { // no confirmed utxo
                  ecl.close();
                  resolve('no valid utxo');
                } else {
                  Promise.all(_utxo.map((_utxoItem, index) => {
                    return new Promise((resolve, reject) => {
                      api.getTransaction(_utxoItem.tx_hash, network, ecl)
                      .then((_rawtxJSON) => {
                        api.log('electrum gettransaction ==>', 'spv.listunspent');
                        api.log(`${index} | ${(_rawtxJSON.length - 1)}`, 'spv.listunspent');
                        api.log(_rawtxJSON, 'spv.listunspent');

                        // decode tx
                        const _network = api.getNetworkData(network);
                        let decodedTx;

                        if (api.getTransactionDecoded(_utxoItem.tx_hash, network)) {
                          decodedTx = api.getTransactionDecoded(_utxoItem.tx_hash, network);
                        } else {
                          decodedTx = api.electrumJSTxDecoder(
                            _rawtxJSON,
                            network,
                            _network
                          );
                          api.getTransactionDecoded(
                            _utxoItem.tx_hash,
                            network,
                            decodedTx
                          );
                        }

                        // api.log('decoded tx =>', true);
                        // api.log(decodedTx, true);

                        if (!decodedTx) {
                          _atLeastOneDecodeTxFailed = true;
                          resolve('cant decode tx');
                        } else {
                          if (network === 'komodo' ||
                              network.toLowerCase() === 'kmd') {
                            let interest = 0;

                            if (Number(_utxoItem.value) * 0.00000001 >= 10 &&
                                decodedTx.format.locktime > 0) {
                              interest = api.kmdCalcInterest(
                                decodedTx.format.locktime,
                                _utxoItem.value,
                                _utxoItem.height,
                                true
                              );
                            }

                            const _locktimeSec = checkTimestamp(decodedTx.format.locktime * 1000);
                            let _resolveObj = {
                              txid: _utxoItem.tx_hash,
                              vout: _utxoItem.tx_pos,
                              address,
                              amount: Number(_utxoItem.value) * 0.00000001,
                              amountSats: _utxoItem.value,
                              locktime: decodedTx.format.locktime,
                              interest: interest >= 0 ? Number((interest * 0.00000001).toFixed(8)) : 0,
                              interestSats: interest >= 0 ? interest : 0,
                              timeElapsedFromLocktimeInSeconds: decodedTx.format.locktime ? _locktimeSec : 0,
                              timeTill1MonthInterestStopsInSeconds: decodedTx.format.locktime ? (UTXO_1MONTH_THRESHOLD_SECONDS - _locktimeSec > 0 ? UTXO_1MONTH_THRESHOLD_SECONDS - _locktimeSec : 0) : 0,
                              interestRulesCheckPass: !decodedTx.format.locktime || Number(decodedTx.format.locktime) === 0 || _locktimeSec > UTXO_1MONTH_THRESHOLD_SECONDS || _utxoItem.value < 1000000000 ? false : true,
                              confirmations: Number(_utxoItem.height) === 0 ? 0 : currentHeight - _utxoItem.height,
                              height: _utxoItem.height,
                              currentHeight,
                              spendable: true,
                              verified: false,
                            };

                            if (api.electrumCache[network] &&
                                api.electrumCache[network].verboseTx &&
                                api.electrumCache[network].verboseTx[_utxoItem.tx_hash] &&
                                api.electrumCache[network].verboseTx[_utxoItem.tx_hash].hasOwnProperty('confirmations')) {
                              if (api.electrumCache[network].verboseTx[_utxoItem.tx_hash].confirmations >= 2) {
                                _resolveObj.dpowSecured = true;
                              } else {
                                _resolveObj.dpowSecured = false;
                              }
                            }

                            // merkle root verification against another electrum server
                            if (verify) {
                              api.verifyMerkleByCoin(
                                api.findCoinName(network),
                                _utxoItem.tx_hash,
                                _utxoItem.height
                              )
                              .then((verifyMerkleRes) => {
                                if (verifyMerkleRes &&
                                    verifyMerkleRes === api.CONNECTION_ERROR_OR_INCOMPLETE_DATA) {
                                  verifyMerkleRes = false;
                                }

                                _resolveObj.verified = verifyMerkleRes;
                                resolve(_resolveObj);
                              });
                            } else {
                              resolve(_resolveObj);
                            }
                          } else {
                            let _resolveObj = {
                              txid: _utxoItem.tx_hash,
                              vout: _utxoItem.tx_pos,
                              address,
                              amount: Number(_utxoItem.value) * 0.00000001,
                              amountSats: _utxoItem.value,
                              confirmations: Number(_utxoItem.height) === 0 ? 0 : currentHeight - _utxoItem.height,
                              height: _utxoItem.height,
                              currentHeight,
                              spendable: true,
                              verified: false,
                            };

                            if (api.electrumCache[network] &&
                                api.electrumCache[network].verboseTx &&
                                api.electrumCache[network].verboseTx[_utxoItem.tx_hash] &&
                                api.electrumCache[network].verboseTx[_utxoItem.tx_hash].hasOwnProperty('confirmations')) {
                              if (api.electrumCache[network].verboseTx[_utxoItem.tx_hash].confirmations >= 2) {
                                _resolveObj.dpowSecured = true;
                              } else {
                                _resolveObj.dpowSecured = false;
                              }
                            }

                            // merkle root verification against another electrum server
                            if (verify) {
                              api.verifyMerkleByCoin(
                                api.findCoinName(network),
                                _utxoItem.tx_hash,
                                _utxoItem.height
                              )
                              .then((verifyMerkleRes) => {
                                if (verifyMerkleRes &&
                                    verifyMerkleRes === api.CONNECTION_ERROR_OR_INCOMPLETE_DATA) {
                                  verifyMerkleRes = false;
                                }

                                _resolveObj.verified = verifyMerkleRes;
                                resolve(_resolveObj);
                              });
                            } else {
                              resolve(_resolveObj);
                            }
                          }
                        }
                      });
                    });
                  }))
                  .then(promiseResult => {
                    ecl.close();

                    if (!_atLeastOneDecodeTxFailed) {
                      api.log(promiseResult, 'spv.listunspent');
                      resolve(promiseResult);
                    } else {
                      api.log('listunspent error, cant decode tx(s)', 'spv.listunspent');
                      resolve('decode error');
                    }
                  });
                }
              } else {
                ecl.close();
                resolve('cant get current height');
              }
            });
          } else {
            ecl.close();
            resolve(api.CONNECTION_ERROR_OR_INCOMPLETE_DATA);
          }
        });
      });
    } else {
      return new Promise((resolve, reject) => {
        ecl.connect();
        ecl.blockchainAddressListunspent(_address)
        .then((json) => {
          ecl.close();

          if (json &&
              json.length) {
            resolve(json);
          } else {
            resolve(api.CONNECTION_ERROR_OR_INCOMPLETE_DATA);
          }
        });
      });
    }
  }

  api.get('/electrum/listunspent', (req, res, next) => {
    async function _getListunspent() {
      const network = req.query.network || api.validateChainTicker(req.query.coin);
      const ecl = await api.ecl(network);

      if (req.query.full &&
          req.query.full === 'true') {
        api.electrum.listunspent(
          ecl,
          req.query.address,
          network,
          true,
          req.query.verify
        )
        .then((listunspent) => {
          api.log('electrum listunspent ==>', 'spv.listunspent');

          const retObj = {
            msg: 'success',
            result: listunspent,
          };

          res.end(JSON.stringify(retObj));
        });
      } else {
        api.electrum.listunspent(ecl, req.query.address, network)
        .then((listunspent) => {
          ecl.close();
          api.log('electrum listunspent ==>', 'spv.listunspent');

          const retObj = {
            msg: 'success',
            result: listunspent,
          };

          res.end(JSON.stringify(retObj));
        });
      }
    };
    _getListunspent();
  });

  return api;
};