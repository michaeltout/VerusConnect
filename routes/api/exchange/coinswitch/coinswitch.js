const request = require('request');
const Promise = require('bluebird');
const { randomBytes } = require('crypto');
const signature = require('agama-wallet-lib/src/message');
const API_KEY_DEV = 'cRbHFJTlL6aSfZ0K2q7nj6MgV5Ih4hbA2fUG0ueO';
const COINSWITCH_TIMEOUT = 2000;
// TODO: fixed api(?)

module.exports = (api) => {
  api.coinswitchStatusLookup = [
    'complete',
    'failed',
    'refunded',
    'timeout',
  ];

  api.coinswitchGetStatus = (res, req, orderId) => {
    let options;
    let apiKey = api.exchangesCache.coinswitch[orderId] && api.exchangesCache.coinswitch[orderId].apiKey ? api.exchangesCache.coinswitch[orderId].apiKey : null;
    
    if (apiKey) {
      api.log(`order ${orderId} has API key ${apiKey}`, 'exchanges.coinswitch.order');
      options = {
        method: 'GET',
        url: `https://api.coinswitch.co/v2/order/${orderId}`,
        headers: {
          'x-user-ip': '127.0.0.1',
          'x-api-key': req.query.general.main.dev ? API_KEY_DEV : apiKey,
        },
      };
    } else {
      options = {
        method: 'GET',
        url: `https://www.atomicexplorer.com/api/exchanges/coinswitch?method=getOrder&&orderId=${orderId}`,
      };
    }
  
    api.exchangeHttpReq(options)
    .then((result) => {
      api.log(result, 'exchanges.coinswitch.order');

      if (result &&
          result.result &&
          typeof result.result === 'string' &&
          result.result.indexOf('\"') > -1) {
        result.result = JSON.parse(result.result);
      }

      if (result.msg === 'success' &&
          result.result.success &&
          !result.result.data) {
        const retObj = {
          msg: 'error',
          result: 'no data',
        };
        res.end(JSON.stringify(retObj));
        api.log(`coinswitch request order ${orderId} state update failed`, 'exchanges.coinswitch');
      } else {
        if (result.result.data &&
            result.result.data.orderId) {
          api.exchangesCache.coinswitch[result.result.data.orderId] = result.result.data;
          
          if (api.appConfig.exchanges.coinswitchKey) {
            api.exchangesCache.coinswitch[result.result.data.orderId].apiKey = api.appConfig.exchanges.coinswitchKey;
          }

          api.saveLocalExchangesCache();
          api.log(`coinswitch request order ${orderId} state update success, new state is ${result.result.data.status}`, 'exchanges.coinswitch');
        } else {
          api.log(`coinswitch request order ${orderId} state update failed`, 'exchanges.coinswitch');
        }
        res.end(JSON.stringify(result));
      }
    });
  };

  //TODO: Re-evauluate as POST or eliminate use of API token
  /*
  api.get('/exchanges/coinswitch/coins', (req, res, next) => {
    if (api.checkToken(req.query.token)) {
      let options;

      if (api.appConfig.exchanges.coinswitchKey) {
        options = {
          method: 'GET',
          url: 'https://api.coinswitch.co/v2/coins',
          headers: {
            'x-user-ip': '127.0.0.1',
            'x-api-key': req.query.general.main.dev ? API_KEY_DEV : api.appConfig.exchanges.coinswitchKey,
          },
        };
      } else {
        options = {
          method: 'GET',
          url: 'https://www.atomicexplorer.com/api/exchanges/coinswitch?method=getCoins',
        };
      }
    
      api.exchangeHttpReq(options)
      .then((result) => {
        if (result &&
            result.result &&
            typeof result.result === 'string' &&
            result.result.indexOf('\"') > -1) {
          result.result = JSON.parse(result.result);
        }
        res.end(JSON.stringify(result));
      });
    } else {
      const retObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(retObj));
    }
  });*/

  /*
   *  type: GET
   *
   */
  //TODO: Re-evauluate as POST or eliminate use of API token
  /*
  api.get('/exchanges/coinswitch/rate', (req, res, next) => {
    if (api.checkToken(req.query.token)) {
      let options;
      
      if (api.appConfig.exchanges.coinswitchKey) {
        options = {
          method: 'POST',
          url: 'https://api.coinswitch.co/v2/rate',
          headers: {
            'x-user-ip': '127.0.0.1',
            'x-api-key': req.query.general.main.dev ? API_KEY_DEV : api.appConfig.exchanges.coinswitchKey,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            depositCoin: req.query.src,
            destinationCoin: req.query.dest,
          }),
        };
      } else {
        options = {
          method: 'GET',
          url: `https://www.atomicexplorer.com/api/exchanges/coinswitch?method=getRate&src=${req.query.src}&dest=${req.query.dest}`,
        };
      }
    
      api.exchangeHttpReq(options)
      .then((result) => {
        api.log(result, 'exchanges.coinswitch.rate');

        if (result.msg === 'success' &&
            result.result.success &&
            !result.result.data) {
          const retObj = {
            msg: 'error',
            result: 'unavailable',
          };
          res.end(JSON.stringify(retObj));
        } else {
          if (result &&
              result.result &&
              typeof result.result === 'string' &&
              result.result.indexOf('\"') > -1) {
            result.result = JSON.parse(result.result);
          }
          res.end(JSON.stringify(result));
        }
      });
    } else {
      const retObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(retObj));
    }
  });*.

  /*
   *  type: GET
   *
   */
  //TODO: Re-evauluate as POST or eliminate use of API token
  /*
  api.get('/exchanges/coinswitch/order/place', (req, res, next) => {
    if (api.checkToken(req.query.token)) {
      let options;
      
      if (api.appConfig.exchanges.coinswitchKey) {
        let _body = {
          depositCoin: req.query.src,
          destinationCoin: req.query.dest,
          depositCoinAmount: req.query.srcAmount,
          destinationCoinAmount: req.query.destAmount,
          destinationAddress: {
            address: req.query.destPub,
          },
          refundAddress: {
            address: req.query.refundPub,
          },
        };

        if (!Number(_body.destinationCoinAmount)) {
          delete _body.destinationCoinAmount;
        }

        options = {
          method: 'POST',
          url: 'https://api.coinswitch.co/v2/order',
          headers: {
            'x-user-ip': '127.0.0.1',
            'x-api-key': req.query.general.main.dev ? API_KEY_DEV : api.appConfig.exchanges.coinswitchKey,
            'content-type': 'application/json',
          },
          body: JSON.stringify(_body),
        };
      } else {
        options = {
          method: 'GET',
          url: `https://www.atomicexplorer.com/api/exchanges/coinswitch?method=placeOrder&src=${req.query.src}&dest=${req.query.dest}&srcAmount=${req.query.srcAmount}&destAmount=${req.query.destAmount}&destPub=${req.query.destPub}&refundPub=${req.query.refundPub}`,
        };
      }
    
      api.exchangeHttpReq(options)
      .then((result) => {
        api.log(result, 'exchanges.coinswitch.order.place');

        if (result &&
            result.result &&
            typeof result.result === 'string' &&
            result.result.indexOf('\"') > -1) {
          result.result = JSON.parse(result.result);
        }

        if (result.msg === 'success' &&
            result.result.success &&
            !result.result.data) {
          const retObj = {
            msg: 'error',
            result: 'no data',
          };
          res.end(JSON.stringify(retObj));
        } else {
          if (result.result.data &&
              result.result.data.orderId) {
            api.coinswitchGetStatus(res, req, result.result.data.orderId);
          } else {
            res.end(JSON.stringify(result));
          }
        }
      });
    } else {
      const retObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(retObj));
    }
  });*/

  /*
   *  type: GET
   *
   */
  //TODO: Re-evauluate as POST or eliminate use of API token
  /*
  api.get('/exchanges/coinswitch/order', (req, res, next) => {
    if (api.checkToken(req.query.token)) {
      const _orderId = req.query.orderId;

      api.log(api.exchangesCache.coinswitch, 'exchages.coinswitch.cache');

      if (api.exchangesCache.coinswitch[_orderId]) {
        api.log(`coinswitch order ${_orderId} state is ${api.exchangesCache.coinswitch[_orderId].status}`, 'exchanges.coinswitch');

        if (api.coinswitchStatusLookup.indexOf(api.exchangesCache.coinswitch[_orderId].status) === -1 &&
            !api.exchangesCache.coinswitch[_orderId].outputTransactionHash) {
          api.log(`coinswitch request order ${_orderId} state update`, 'exchanges.coinswitch');
          api.coinswitchGetStatus(res, req, _orderId);
        } else {
          const retObj = {
            msg: 'success',
            result: api.exchangesCache.coinswitch[_orderId],
          };
          res.end(JSON.stringify(retObj));
        }
      } else {
        api.coinswitchGetStatus(res, req, _orderId);
      }
    } else {
      const retObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(retObj));
    }
  });*.

  /*
   *  type: POST
   *
   */
  api.post('/exchanges/cache/coinswitch/order/delete', (req, res, next) => {
    if (api.checkToken(req.body.token)) {
      delete api.exchangesCache.coinswitch[req.query.orderId];
      // TODO: delete deposit(s) by orderId
      api.saveLocalExchangesCache();

      const retObj = {
        msg: 'success',
        result: api.exchangesCache.coinswitch,
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

  /*
   *  type: GET
   *
   */

  //TODO: Re-evauluate as POST or eliminate use of API token
  /*
  api.get('/exchanges/coinswitch/history/sync', (req, res, next) => {
    if (api.checkToken(req.query.token)) {
      // personal API key
      if (api.appConfig.exchanges.coinswitchKey) {
        let options = {
          method: 'GET',
          url: 'https://api.coinswitch.co/v2/orders',
          headers: {
            'x-user-ip': '127.0.0.1',
            'x-api-key': api.appConfig.exchanges.coinswitchKey,
          },
        };
        const parseOrders = (ordersList, chunk) => {          
          if (ordersList &&
              ordersList.length &&
              typeof ordersList === 'object' &&
              ordersList[0].hasOwnProperty('orderId')) {
            api.log(`found ${ordersList.length} orders in personal API key history`, 'exchanges.coinswitch.history.sync');

            // TODO: validate order data
            for (let i = 0; i < ordersList.length; i++) {
              if (!api.exchangesCache.coinswitch[ordersList[i].orderId]) {
                api.log(`found order ${ordersList[i].orderId} in personal API key history, merge`, 'exchanges.coinswitch.history.sync');
                api.exchangesCache.coinswitch[ordersList[i].orderId] = ordersList[i];
              }
            }

            api.log(`merge orders chunk ${chunk} from personal API key history`, 'exchanges.coinswitch.history.sync');
            if (req.query.save) {
              api.saveLocalExchangesCache();
            }

            return true;
          } else {
            api.log(`orders chunk ${chunk} parse from personal API key history failed`, 'exchanges.coinswitch.history.sync');
          }
        };

        api.exchangeHttpReq(options)
        .then((result) => {
          if (result &&
              result.msg === 'success') {
            const resChunkMain = result.result;
                
            if (resChunkMain.success &&
                resChunkMain.data &&
                resChunkMain.data.items) {
              if (resChunkMain.data.totalCount > resChunkMain.data.count) {
                const _chunks = Math.ceil(resChunkMain.data.totalCount / 25) - 1;
                api.log(`coinswitch orders list is too big, need to split in ${_chunks} chunks`, 'exchanges.coinswitch.history.sync');                
                
                parseOrders(resChunkMain.data.items, 0);
                
                for (let i = 0; i < _chunks; i++) {
                  api.log(`coinswitch chunk url https://api.coinswitch.co/v2/orders?start=${((i + 1) * 25) + 1}`, 'exchanges.coinswitch.history.sync');
                  
                  setTimeout(() => {
                    options = {
                      method: 'GET',
                      url: `https://api.coinswitch.co/v2/orders?start=${(i + 1) * 25}`,
                      headers: {
                        'x-user-ip': '127.0.0.1',
                        'x-api-key': api.appConfig.exchanges.coinswitchKey,
                      },
                    };

                    api.exchangeHttpReq(options)
                    .then((resultChunk) => {
                      if (resultChunk &&
                          resultChunk.msg === 'success') {
                        const resChunk = resultChunk.result;
                            
                        if (resChunk.success &&
                            resChunk.data &&
                            resChunk.data.items) {
                          parseOrders(resChunk.data.items, i + 1);

                          if (i === _chunks - 1) {
                            const retObj = {
                              msg: 'success',
                              result: api.exchangesCache.coinswitch,
                            };
                      
                            res.end(JSON.stringify(retObj));
                          }
                        }
                      } else {
                        api.log(`failed to get chunk ${i + 1} of orders from personal API key history`, 'exchanges.coinswitch.history.sync');
                      }
                    });
                  }, i * COINSWITCH_TIMEOUT);
                }
              } else {
                parseOrders(resChunkMain.data.items, 0);

                const retObj = {
                  msg: 'success',
                  result: api.exchangesCache.coinswitch,
                };
          
                res.end(JSON.stringify(retObj));
              }
            }
          } else {
            api.log('failed to get chunk 0 of orders from personal API key history', 'exchanges.coinswitch.history.sync');
          }
        });
      } else { // remote
        let electrumCoinsList = [];
        let ethereumCoins = [];

        for (let key in api.electrum.coinData) {
          if (key !== 'auth') {
            electrumCoinsList.push(key.toUpperCase());
          }
        }

        for (let key in api.eth.coins) {
          ethereumCoins.push(key);
        }

        api.log(`spv coins: ${electrumCoinsList.join(',')}${ethereumCoins.length ? ', eth' : ''}`, 'exchages.coinswitch.cache.sync');
        
        if (electrumCoinsList &&
            electrumCoinsList.length) {
          let _addressPayload = [];

          for (let i = 0;  i < electrumCoinsList.length; i++) {
            const _randomString = randomBytes(32).toString('hex');
            const _keys = api.electrumKeys[electrumCoinsList[i].toLowerCase()];

            if (_keys.priv &&
                _keys.priv !== _keys.pub) {
              const _sig = signature.btc.sign(_keys.priv, _randomString);
              
              api.log(`${electrumCoinsList[i]} ${_keys.pub} sig ${_sig}`, 'exchages.coinswitch.cache.sync');
              _addressPayload.push({
                pub: _keys.pub,
                sig: _sig,
                message: _randomString,
              });
            }
          }
          const options = {
            method: 'POST',
            url: 'https://www.atomicexplorer.com/api/exchanges/coinswitch/history',
            headers: {
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              address: _addressPayload,
            }),
          };
          
          api.exchangeHttpReq(options)
          .then((result) => {
            if (result &&
                result.msg === 'success') {
              if (req.query.save) {
                const _remoteOrdersList = result.result.result;

                if (_remoteOrdersList &&
                    _remoteOrdersList.length &&
                    typeof _remoteOrdersList === 'object' &&
                    _remoteOrdersList[0].hasOwnProperty('orderId')) {
                  api.log(`found ${result.result.result.length} orders in remote history`, 'exchanges.coinswitch.history.sync');

                  // TODO: validate order data
                  for (let i = 0; i < _remoteOrdersList.length; i++) {
                    if (!api.exchangesCache.coinswitch[_remoteOrdersList[i].orderId]) {
                      api.log(`found order ${_remoteOrdersList[i].orderId} in remote history, merge`, 'exchanges.coinswitch.history.sync');
                      api.exchangesCache.coinswitch[_remoteOrdersList[i].orderId] = _remoteOrdersList[i];
                    }
                  }
                  const retObj = {
                    msg: 'success',
                    result: api.exchangesCache.coinswitch,
                  };
            
                  res.end(JSON.stringify(retObj));
                  api.saveLocalExchangesCache();
                } else {
                  const retObj = {
                    msg: 'error',
                    result: 'unable to sync orders history',
                  };
            
                  res.end(JSON.stringify(retObj));
                }
              } else {
                res.end(JSON.stringify(result.result));
              }
            } else {
              const retObj = {
                msg: 'error',
                result: 'unable to sync orders history',
              };
        
              res.end(JSON.stringify(retObj));
            }
          });
        } else {
          const retObj = {
            msg: 'error',
            result: 'no coins to sync',
          };
    
          res.end(JSON.stringify(retObj));
        }
      }
    } else {
      const retObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(retObj));
    }
  });*/

  return api;
};