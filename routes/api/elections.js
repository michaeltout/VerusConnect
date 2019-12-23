const bs58check = require('bs58check');
const bitcoin = require('bitgo-utxo-lib');
const Promise = require('bluebird');
const { hex2str } = require('agama-wallet-lib/src/crypto/utils');

module.exports = (api) => {
  api.elections = {};

  api.post('/elections/status', (req, res, next) => {
    if (api.checkToken(req.body.token)) {
      const retObj = {
        msg: 'success',
        result: api.elections.pub ? api.elections.pub : 'unauth',
      };

      res.end(JSON.stringify(retObj));
    } else {
      const retObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(retObj));
    }
  });

  api.post('/elections/login', (req, res, next) => {
    if (api.checkToken(req.body.token)) {
      const _seed = req.body.seed;
      const _network = req.body.network;
      let keys;
      let isWif = false;

      if (_seed.match('^[a-zA-Z0-9]{34}$')) {
        api.log('watchonly elections pub addr', 'elections');
        api.elections = {
          priv: _seed,
          pub: _seed,
        };
      } else {
        try {
          bs58check.decode(_seed);
          isWif = true;
        } catch (e) {}

        if (isWif) {
          try {
            let key = bitcoin.ECPair.fromWIF(
              _seed,
              api.getNetworkData(_network.toLowerCase()),
              true
            );
            keys = {
              priv: key.toWIF(),
              pub: key.getAddress(),
            };
          } catch (e) {
            _wifError = true;
          }
        } else {
          keys = api.seedToWif(
            _seed,
            _network,
            req.body.iguana
          );
        }

        api.elections = {
          priv: keys.priv,
          pub: keys.pub,
        };
      }

      const retObj = {
        msg: 'success',
        result: api.elections.pub,
      };

      res.end(JSON.stringify(retObj));
    } else {
      const retObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(retObj));
    }
  });

  api.post('/elections/logout', (req, res, next) => {
    if (api.checkToken(req.body.token)) {
      api.elections = {};

      const retObj = {
        msg: 'success',
        result: true,
      };

      res.end(JSON.stringify(retObj));
    } else {
      const retObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(retObj));
    }
  });

  api.electionsDecodeTx = (decodedTx, ecl, network, _network, transaction, blockInfo, address) => {
    let txInputs = [];

    return new Promise((resolve, reject) => {
      if (decodedTx &&
          decodedTx.inputs) {
        Promise.all(decodedTx.inputs.map((_decodedInput, index) => {
          return new Promise((_resolve, _reject) => {
            if (_decodedInput.txid !== '0000000000000000000000000000000000000000000000000000000000000000') {
              ecl.blockchainTransactionGet(_decodedInput.txid)
              .then((rawInput) => {
                let decodedVinVout;

                if (api.getTransactionDecoded(_decodedInput.txid, network)) {
                  decodedTx = api.getTransactionDecoded(_decodedInput.txid, network);
                } else {
                  decodedTx = api.electrumJSTxDecoder(rawInput, network, _network);
                  api.getTransactionDecoded(_decodedInput.txid, network, decodedTx)
                }

                api.log('electrum raw input tx ==>', 'elections.decodeTx');

                if (decodedVinVout) {
                  api.log(decodedVinVout.outputs[_decodedInput.n], 'elections.decodeTx');
                  txInputs.push(decodedVinVout.outputs[_decodedInput.n]);
                  _resolve(true);
                } else {
                  _resolve(true);
                }
              });
            } else {
              _resolve(true);
            }
          });
        }))
        .then(promiseResult => {
          const _parsedTx = {
            network: decodedTx.network,
            format: decodedTx.format,
            inputs: txInputs,
            outputs: decodedTx.outputs,
            height: transaction.height,
            timestamp: Number(transaction.height) === 0 ? Math.floor(Date.now() / 1000) : blockInfo.timestamp,
          };

          resolve(api.parseTransactionAddresses(_parsedTx, address, network.toLowerCase() === 'kmd', { skipTargetAddress: true }));
        });
      } else {
        const _parsedTx = {
          network: decodedTx.network,
          format: 'cant parse',
          inputs: 'cant parse',
          outputs: 'cant parse',
          height: transaction.height,
          timestamp: Number(transaction.height) === 0 ? Math.floor(Date.now() / 1000) : blockInfo.timestamp,
        };

        resolve(api.parseTransactionAddresses(_parsedTx, address, network.toLowerCase() === 'kmd'));
      }
    });
  };

  //TODO: Re-evauluate as POST or eliminate use of API token
  /*
  api.get('/elections/listtransactions', (req, res, next) => {
    if (api.checkToken(req.query.token)) {
      async function _electionsListtransactions() {
        const network = req.query.network || api.validateChainTicker(req.query.coin);
        const ecl = await api.ecl(network);
        const type = req.query.type;
        const _address = req.query.address;
        const __address = ecl.protocolVersion && ecl.protocolVersion === '1.4' ? pubToElectrumScriptHashHex(_address, btcnetworks[network.toLowerCase()] || btcnetworks.kmd) : _address;

        api.log('electrum elections listtransactions ==>', 'elections.listtransactions');

        const MAX_TX = req.query.maxlength || 10;
        ecl.connect();

        ecl.blockchainAddressGetHistory(__address)
        .then((json) => {
          if (json &&
              json.length) {
            let _rawtx = [];

            json = api.sortTransactions(json);
            // json = json.length > MAX_TX ? json.slice(0, MAX_TX) : json;

            api.log(json.length, 'elections.listtransactions');

            Promise.all(json.map((transaction, index) => {
              return new Promise((resolve, reject) => {
                ecl.blockchainBlockGetHeader(transaction.height)
                .then((blockInfo) => {
                  if (blockInfo &&
                      blockInfo.timestamp) {
                    ecl.blockchainTransactionGet(transaction['tx_hash'])
                    .then((_rawtxJSON) => {
                      //api.log('electrum gettransaction ==>', true);
                      //api.log((index + ' | ' + (_rawtxJSON.length - 1)), true);
                      //api.log(_rawtxJSON, true);

                      // decode tx
                      const _network = api.getNetworkData(network);
                      const decodedTx = api.electrumJSTxDecoder(
                        _rawtxJSON,
                        network,
                        _network
                      );
                      let _res = {};
                      let _opreturnFound = false;
                      let _region;

                      if (decodedTx &&
                          decodedTx.outputs &&
                          decodedTx.outputs.length) {
                        for (let i = 0; i < decodedTx.outputs.length; i++) {
                          if (decodedTx.outputs[i].scriptPubKey.asm.indexOf('OP_RETURN') > -1) {
                            _opreturnFound = true;
                            _region = hex2str(decodedTx.outputs[i].scriptPubKey.hex.substr(4, decodedTx.outputs[i].scriptPubKey.hex.length));
                            api.log(`found opreturn tag ${_region}`, 'elections.listtransactions');
                            break;
                          }
                        }
                      }

                      if (_opreturnFound) {
                        let _candidate = {};

                        for (let i = 0; i < decodedTx.outputs.length; i++) {
                          if (type === 'voter' &&
                              decodedTx.outputs[i].scriptPubKey.addresses &&
                              decodedTx.outputs[i].scriptPubKey.addresses[0] &&
                              decodedTx.outputs[i].scriptPubKey.addresses[0] !== _address) {
                            if (_region === 'ne2k18-na-1-eu-2-ae-3-sh-4') {
                              const _regionsLookup = [
                                'ne2k18-na',
                                'ne2k18-eu',
                                'ne2k18-ae',
                                'ne2k18-sh'
                              ];

                              api.log(`i voted ${decodedTx.outputs[i].value} for ${decodedTx.outputs[i].scriptPubKey.addresses[0]}`, 'elections.listtransactions');
                              _rawtx.push({
                                address: decodedTx.outputs[i].scriptPubKey.addresses[0],
                                amount: decodedTx.outputs[i].value,
                                region: _regionsLookup[i],
                                timestamp: blockInfo.timestamp,
                              });
                              resolve(true);
                            } else {
                              api.log(`i voted ${decodedTx.outputs[i].value} for ${decodedTx.outputs[i].scriptPubKey.addresses[0]}`, 'elections.listtransactions');
                              _rawtx.push({
                                address: decodedTx.outputs[i].scriptPubKey.addresses[0],
                                amount: decodedTx.outputs[i].value,
                                region: _region,
                                timestamp: blockInfo.timestamp,
                              });
                              resolve(true);
                            }
                          }

                          if (type === 'candidate') {
                            if (_region === 'ne2k18-na-1-eu-2-ae-3-sh-4') {
                              if (decodedTx.outputs[i].scriptPubKey.addresses[0] === _address &&
                                  decodedTx.outputs[i].scriptPubKey.asm.indexOf('OP_RETURN') === -1) {
                                const _regionsLookup = [
                                  'ne2k18-na',
                                  'ne2k18-eu',
                                  'ne2k18-ae',
                                  'ne2k18-sh'
                                ];

                                api.electionsDecodeTx(
                                  decodedTx,
                                  ecl,
                                  network,
                                  _network,
                                  transaction,
                                  blockInfo,
                                  _address
                                )
                                .then((res) => {
                                  api.log(`i received ${decodedTx.outputs[i].value} from ${res.outputAddresses[0]} out ${i} region ${_regionsLookup[i]}`, 'elections.listtransactions');
                                  _rawtx.push({
                                    address: res.outputAddresses[0],
                                    timestamp: blockInfo.timestamp,
                                    amount: decodedTx.outputs[i].value,
                                    region: _regionsLookup[i],
                                  });
                                  resolve(true);
                                });
                              }
                            } else {
                              api.electionsDecodeTx(
                                decodedTx,
                                ecl,
                                network,
                                _network,
                                transaction,
                                blockInfo,
                                _address
                              )
                              .then((res) => {
                                if (decodedTx.outputs[i].scriptPubKey.addresses[0] === _address) {
                                  _candidate.amount = decodedTx.outputs[i].value;
                                } else if (
                                  decodedTx.outputs[i].scriptPubKey.addresses[0] !== _address &&
                                  decodedTx.outputs[i].scriptPubKey.asm.indexOf('OP_RETURN') === -1
                                ) {
                                  _candidate.address = decodedTx.outputs[i].scriptPubKey.addresses[0];
                                  _candidate.region = _region;
                                  _candidate.timestamp = blockInfo.timestamp;
                                }

                                if (i === decodedTx.outputs.length - 1) {
                                  api.log(`i received ${_candidate.amount} from ${_candidate.address} region ${_region}`, 'elections.listtransactions');
                                  _rawtx.push(_candidate);
                                  resolve(true);
                                }
                              });
                            }
                          }
                        }
                      } else {
                        api.log('elections regular tx', 'elections.listtransactions');
                        api.electionsDecodeTx(
                          decodedTx,
                          ecl,
                          network,
                          _network,
                          transaction,
                          blockInfo,
                          _address
                        )
                        .then((_regularTx) => {
                          if (_regularTx[0] &&
                              _regularTx[1]) {
                            _rawtx.push({
                              address: _regularTx[type === 'voter' ? 0 : 1].address || 'self',
                              timestamp: _regularTx[type === 'voter' ? 0 : 1].timestamp,
                              amount: _regularTx[type === 'voter' ? 0 : 1].amount,
                              region: 'unknown',
                              regularTx: true,
                              hash: transaction.tx_hash,
                            });
                          } else {
                            if ((type === 'voter' && _regularTx.type !== 'received') &&
                                (type === 'candidate' && _regularTx.type !== 'sent')) {
                              _rawtx.push({
                                address: _regularTx.address || 'self',
                                timestamp: _regularTx.timestamp,
                                amount: _regularTx.amount,
                                region: 'unknown',
                                regularTx: true,
                                hash: transaction.tx_hash,
                              });
                            }
                          }
                          resolve(true);
                        });
                      }
                    });
                  } else {
                    _rawtx.push({
                      address: 'unknown',
                      timestamp: 'cant get block info',
                      amount: 'unknown',
                      region: 'unknown',
                      regularTx: true,
                    });
                    resolve(false);
                  }
                });
              });
            }))
            .then(promiseResult => {
              ecl.close();

              const retObj = {
                msg: 'success',
                result: _rawtx,
              };

              res.end(JSON.stringify(retObj));
            });
          } else {
            const retObj = {
              msg: 'success',
              result: [],
            };

            res.end(JSON.stringify(retObj));
          }
        });
      };
      _electionsListtransactions();
    } else {
      const retObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(retObj));
    }
  });*/

  return api;
}
