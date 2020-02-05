const Promise = require('bluebird');
const request = require('request');
const chainParams = require('../chainParams');

module.exports = (api) => {
  /*
   *  Combined native dashboard update same as in gui
   *  type: GET
   *  params: coin
   */
  /*
  api.post('/native/dashboard/update', (req, res, next) => {
    if (api.checkToken(req.body.token)) {
      const _coin = req.body.coin;
      const _token = req.body.token;
      let _returnObj;
      let _promiseStack;

      if (_coin === 'CHIPS') {
        _returnObj = {
          getinfo: {},
          listtransactions: [],
          getbalance: {},
          listunspent: {},
          addresses: {},
          getwalletinfo: {},
        };
        _promiseStack = [
          'getinfo',
          'listtransactions',
          'getbalance',
          'getwalletinfo'
        ];
      } else {
        _returnObj = {
          getinfo: {},
          listtransactions: [],
          z_gettotalbalance: {},
          z_getoperationstatus: {},
          listunspent: {},
          addresses: {},
          getwalletinfo: {}
        };
        _promiseStack = [
          'getinfo',
          'listtransactions',
          'z_gettotalbalance',
          'z_getoperationstatus',
          'getwalletinfo'
        ];
      }

      const getAddressesNative = (coin) => {
        const type = [
          'public',
          'private',
        ];

        if (coin === 'CHIPS') {
          type.pop();
        }

        Promise.all(type.map((_type, index) => {
          return new Promise((resolve, reject) => {
            _bitcoinRPC(
              coin,
              _type === 'public' ? 'getaddressesbyaccount' : 'z_listaddresses',
              _type === 'public' ? [''] : null
            )
            .then((_json) => {
              if (_json === 'Work queue depth exceeded' ||
                  !_json) {
                resolve({ error: 'daemon is busy' });
              } else {
                resolve(JSON.parse(_json).result);
              }
            });
          });
        }))
        .then(result => {
          if (result[0] &&
              result[0].length &&
              result[0][0].length &&
              result[0][0].length > 10) {
            const calcBalance = (result, json) => {
              if (json &&
                  json.length &&
                  json[0] &&
                  json[0].address) {
                const allAddrArray = json.map(res => res.address).filter((x, i, a) => a.indexOf(x) == i);

                for (let a = 0; a < allAddrArray.length; a++) {
                  const filteredArray = json.filter(res => res.address === allAddrArray[a]).map(res => res.amount);

                  let isNewAddr = true;

                  for (let x = 0; x < result.length && isNewAddr; x++) {
                    if (result[x]) {
                      for (let y = 0; y < result[x].length && isNewAddr; y++) {
                        if (allAddrArray[a] === result[x][y]) {
                          isNewAddr = false;
                        }
                      }
                    }
                  }

                  if (isNewAddr &&
                      (allAddrArray[a].substring(0, 2) === 'zc' ||
                      allAddrArray[a].substring(0, 2) === 'zt')) {
                    result[1][result[1].length] = allAddrArray[a];
                  } else {
                    result[0][result[0].length] = allAddrArray[a];
                  }
                }
              }

              // remove addr duplicates
              if (result[0] &&
                  result[0].length) {
                result[0] = result[0].filter((elem, pos) => {
                  return result[0].indexOf(elem) === pos;
                });
              }

              if (result[1] &&
                  result[1].length) {
                result[1] = result[1].filter((elem, pos) => {
                  return result[1].indexOf(elem) === pos;
                });
              }

              let newAddressArray = [];

              for (let a = 0; a < result.length; a++) {
                newAddressArray[a] = [];

                if (result[a]) {
                  for (let b = 0; b < result[a].length; b++) {
                    const filteredArraySpends = json.filter(res => res.address === result[a][b]);
                    const filteredArray = json.filter(res => res.address === result[a][b]).map(res => {
                      return {
                        amount: res.amount,
                        reserveAmount: res.reserveAmount
                      }
                    });

                    let nativeSum = 0;
                    let reserveSum = 0
                    let spendableNativeSum = 0;
                    let spendableReserveSum = 0;
                    let canspend = true;

                    for (let i = 0; i < filteredArray.length; i++) {
                      nativeSum += filteredArray[i].amount;
                      reserveSum += filteredArray[i].reserveAmount ? filteredArray[i].reserveAmount : 0;

                      if (filteredArraySpends[i].spendable) {
                        spendableNativeSum += filteredArray[i].amount;
                        spendableReserveSum += filteredArray[i].reserveAmount ? filteredArray[i].reserveAmount : 0;
                      } else {
                        canspend = false;
                      }
                    }

                    newAddressArray[a][b] = {
                      address: result[a][b],
                      amount: nativeSum,
                      reserveAmount: reserveSum,
                      spendable: spendableNativeSum,
                      spendableReserve: spendableReserveSum,
                      canspend,
                      type: a === 0 ? 'public' : 'private',
                    };
                  }
                }
              }

              // get zaddr balance
              if (result[1] &&
                  result[1].length) {
                Promise.all(result[1].map((_address, index) => {
                  return new Promise((resolve, reject) => {
                    _bitcoinRPC(
                      coin,
                      'z_getbalance',
                      [_address]
                    )
                    .then((__json) => {
                      try {
                        __json = JSON.parse(__json);
                      } catch (e) {
                        __json = { error: 'can\'t parse json' };
                      }

                      if (__json &&
                          __json.error) {
                        resolve(0);
                      } else {
                        resolve(__json.result);
                        newAddressArray[1][index] = {
                          address: _address,
                          amount: __json.result,
                          type: 'private',
                          txs: []
                        };
                      }
                    });
                  });
                }))
                .then(zresult => {
                  // get z_listreceivedbyaddress history
                  if (api.appConfig.general.native.zlistreceivedbyaddress ||
                      (chainParams[coin] && chainParams[coin].ac_private)) {

                    Promise.all(result[1].map((_address, index) => {
                      return new Promise((resolve, reject) => {
                        _bitcoinRPC(
                          coin,
                          'z_listreceivedbyaddress',
                          [_address]
                        )
                        .then((__json) => {
                          try {
                            __json = JSON.parse(__json);
                          } catch (e) {
                            __json = { error: 'can\'t parse json' };
                          }
    
                          if (__json &&
                              __json.error) {
                            throw new Error("JSON ERROR");
                          } else {
                            //newAddressArray[1][index].txs = __json.result
                            return (__json.result);
                          }
                        })
                        .then((receivedByAddressList) => {
                          return getZTransactionGroups(coin, receivedByAddressList, [receivedByAddressList])
                        })
                        .then((gottenTransactionsArray) => {
                          let receivedByAddressList = gottenTransactionsArray.shift();

                          for (let i = 0; i < gottenTransactionsArray.length; i++) {
                            let tx = gottenTransactionsArray[i];
                            let pvtx = receivedByAddressList[i];
                            tx.amount = pvtx.amount;
                            tx.memo = pvtx.memo;
                            tx.address = _address;
                            tx.category = 'receive';
                            tx.ztx = true;
                          }

                          resolve(gottenTransactionsArray)
                        })
                      });
                    }))
                    .then(zresultHistory => {

                      let newPvAddressArray = newAddressArray[1]

                      for (let i = 0; i < zresultHistory.length; i++) {
                        newPvAddressArray[i].txs = zresultHistory[i]
                      }

                      _returnObj.addresses = {
                        public: newAddressArray[0],
                        private: newPvAddressArray,
                      };
    
                      const retObj = {
                        msg: 'success',
                        result: _returnObj,
                      };
    
                      res.end(JSON.stringify(retObj));
                    });
                  } else {
                    _returnObj.addresses = {
                      public: newAddressArray[0],
                      private: newAddressArray[1],
                    };
  
                    const retObj = {
                      msg: 'success',
                      result: _returnObj,
                    };
  
                    res.end(JSON.stringify(retObj));
                  }
                });
              } else {
                _returnObj.addresses = {
                  public: newAddressArray[0],
                  private: newAddressArray[1],
                };

                const retObj = {
                  msg: 'success',
                  result: _returnObj,
                };

                res.end(JSON.stringify(retObj));
              }
            }

            _bitcoinRPC(coin, 'listunspent')
            .then((__json) => {
              if (__json === 'Work queue depth exceeded' ||
                  !__json) {
                const retObj = {
                  msg: 'success',
                  result: _returnObj,
                };

                res.end(JSON.stringify(retObj));
              } else {
                _returnObj.listunspent = JSON.parse(__json);

                calcBalance(
                  result,
                  JSON.parse(__json).result
                );
              }
            });
          } else {
            _returnObj.addresses = {
              public: {},
              private: {},
            };

            const retObj = {
              msg: 'success',
              result: _returnObj,
            };

            res.end(JSON.stringify(retObj));
          }
        })
      }

      const _bitcoinRPC = (coin, cmd, params) => {
        return new Promise((resolve, reject) => {
          let _payload;

          if (params) {
            _payload = {
              mode: null,
              chain: coin,
              cmd: cmd,
              params: params,
              rpc2cli: req.body.rpc2cli,
              token: _token,
            };
          } else {
            _payload = {
              mode: null,
              chain: coin,
              cmd: cmd,
              rpc2cli: req.body.rpc2cli,
              token: _token,
            };
          }

          const options = {
            url: `http://127.0.0.1:${api.appConfig.general.main.agamaPort}/api/cli`,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ payload: _payload }),
            timeout: 120000,
          };

          request(options, (error, response, body) => {
            resolve(body);
          });
        });
      }

      const getZTransactionGroups = (coin, array, results) => {

        let txInputGroups = [{ coin: coin, group: array.slice(0, 100)}];
        let numCounted = txInputGroups[0].group.length;
      
        while (numCounted < array.length) {
          txInputGroups.push({coin: coin, group: array.slice(numCounted, numCounted + 100)});
          numCounted += txInputGroups[txInputGroups.length - 1].group.length;
        }
      
        return txInputGroups.reduce((p, a) => {
          return p.then(chainResults => {
            return getZTransactions(a.coin, a.group).then( txGroup => {
              return chainResults.concat(txGroup);
            })
          })},
          Promise.resolve(results)
        )
      }
      
      const getZTransactions = (coin, array) => {
        let promiseArray = [];
        for (let i = 0; i < array.length; i++)
        {
          
            promiseArray.push(
              new Promise((resolve, reject) => {
                _bitcoinRPC(
                  coin,
                  'gettransaction',
                  [array[i].txid]
                )
                .then((__json) => {
                  try {
                    __json = JSON.parse(__json);
                  } catch (e) {
                    __json = { error: 'can\'t parse json' };
                  }

                  if (__json &&
                      __json.error) {
                    throw new Error("JSON ERROR");
                  } else {
                    resolve(__json.result);
                  }
                })
              }
            ));
        }
        return Promise.all(promiseArray);
      }

      Promise.all(_promiseStack.map((_call, index) => {
        let _params;

        if (_call === 'listtransactions') {
          _params = [
            '*',
            api.appConfig.general.native.maxTxListLength,
            0,
          ];
        }

        return new Promise((resolve, reject) => {
          _bitcoinRPC(
            _coin,
            _call,
            _params
          )
          .then((json) => {
            if (json === 'Work queue depth exceeded' ||
                !json) {
              _returnObj[_call] = { error: 'daemon is busy' };
            } else {
              let _jsonParsed = JSON.parse(json);

              if (_jsonParsed &&
                  _jsonParsed.result &&
                  _jsonParsed.result.length) {
                if (api.appConfig.general.native.zgetoperationresult &&
                  _call === 'z_getoperationstatus') {
                  api.log('found runtime z data, purge all', 'native');

                  _bitcoinRPC(
                    _coin,
                    'z_getoperationresult',
                    []
                  )
                  .then((_json) => {
                    const __jsonParsed = JSON.parse(_json);
                    
                    if (__jsonParsed &&
                        __jsonParsed.result) {
                      api.log('found runtime z data, purge success', 'native');
                    } else {
                      api.log('found runtime z data, purge error' + JSON.stringify(__jsonParsed.error), 'native');
                    }
                  });
                } else if (_call === 'listtransactions') {
                  _jsonParsed.result = _jsonParsed.result.filter(
                    (tx) => {
                      if (tx.category === 'stake') {
                        if (tx.amount > 0) {
                          return true;
                        }
                        else {
                          return false;
                        }
                      }
                      else {
                        return true
                      }
                  });
                }
              }
              _returnObj[_call] = _jsonParsed;
            }

            resolve(json);
          });
        });
      }))
      .then(result => {
        getAddressesNative(_coin);
      });
    } else {
      const retObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(retObj));
    }
  });
  */
  return api;
};