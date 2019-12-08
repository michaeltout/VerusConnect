const request = require('request');
const Promise = require('bluebird');

module.exports = (api) => {
  api.changellyStatusLookup = [
    'finished',
    'failed',
    'refunded',
    'overdue',
  ];

  api.changellyGetStatus = (res, req, orderId) => {
    const options = {
      method: 'GET',
      url: `https://www.atomicexplorer.com/api/exchanges/changelly?method=getOrder&orderId=${orderId}`,
    };
  
    api.exchangeHttpReq(options)
    .then((result) => {
      api.log(result, 'exchanges.changelly.order');

      if (result.error) {
        const retObj = {
          msg: 'error',
          result: result.error,
        };
        res.end(JSON.stringify(retObj));
        api.log(`changelly request order ${orderId} state update failed`, 'exchanges.changelly');
      } else {
        if (result.result &&
            api.exchangesCache.changelly[orderId]) {
          api.exchangesCache.changelly[orderId].status = result.result;
          api.saveLocalExchangesCache();
          api.log(`changelly request order ${orderId} state update success, new state is ${result.result}`, 'exchanges.changelly');
        } else {
          api.log(`changelly request order ${orderId} state update failed`, 'exchanges.changelly');
        }
        res.end(JSON.stringify(result));
      }
    });
  };

  api.get('/exchanges/changelly/coins', (req, res, next) => {
    if (api.checkToken(req.query.token)) {
      const options = {
        method: 'GET',
        url: 'https://www.atomicexplorer.com/api/exchanges/changelly?method=getCoins',
      };
    
      api.exchangeHttpReq(options)
      .then((result) => {
        res.end(JSON.stringify(result));
      });
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
  api.get('/exchanges/changelly/rate', (req, res, next) => {
    if (api.checkToken(req.query.token)) {
      if (req.query.combined) {
        const urls = [
          `https://www.atomicexplorer.com/api/exchanges/changelly?method=getRate&src=${req.query.src}&dest=${req.query.dest}`,
          `https://www.atomicexplorer.com/api/exchanges/changelly?method=getMinAmount&src=${req.query.src}&dest=${req.query.dest}`,
        ];
        Promise.all(urls.map((url, index) => {
          return new Promise((resolve, reject) => {
            const options = {
              method: 'GET',
              url,
            };
          
            api.exchangeHttpReq(options)
            .then((result) => {
              api.log(result, 'exchanges.changelly.rate.combined');
    
              if (result.error) {
                resolve(result.error);
              } else {
                resolve(result.result.result);
              }
            });
          });
        }))
        .then(result => {
          const retObj = {
            msg: 'success',
            result: {
              rate: result[0],
              minAmount: result[1],
            },
          };
          res.end(JSON.stringify(retObj));
        });
      } else {
        const options = {
          method: 'GET',
          url: `https://www.atomicexplorer.com/api/exchanges/changelly?method=getRate&src=${req.query.src}&dest=${req.query.dest}`,
        };
      
        api.exchangeHttpReq(options)
        .then((result) => {
          api.log(result, 'exchanges.changelly.rate');

          if (result.error) {
            const retObj = {
              msg: 'error',
              result: result.error,
            };
            res.end(JSON.stringify(retObj));
          } else {
            res.end(JSON.stringify(result));
          }
        });
      }
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
  api.get('/exchanges/changelly/order/place', (req, res, next) => {
    if (api.checkToken(req.query.token)) {
      const options = {
        method: 'GET',
        url: `https://www.atomicexplorer.com/api/exchanges/changelly?method=orderPlace&src=${req.query.src}&dest=${req.query.dest}&srcAmount=${req.query.srcAmount}&destAmount=${req.query.destAmount}&destPub=${req.query.destPub}&refundPub=${req.query.refundPub}`,
      };
    
      api.exchangeHttpReq(options)
      .then((result) => {
        api.log(result, 'exchanges.changelly.order.place');

        if (result.error) {
          const retObj = {
            msg: 'error',
            result: result.error,
          };
          res.end(JSON.stringify(retObj));
        } else {
          if (result.result &&
              result.result.id) {
            api.changellyGetStatus(res, req, result.result.id);
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
  });

  /*
   *  type: GET
   *
   */
  api.get('/exchanges/changelly/getMinAmount', (req, res, next) => {
    if (api.checkToken(req.query.token)) {
      const options = {
        method: 'GET',
        url: `https://www.atomicexplorer.com/api/exchanges/changelly?method=getMinAmount&src=${req.query.src}&dest=${req.query.dest}`,
      };
    
      api.exchangeHttpReq(options)
      .then((result) => {
        api.log(result, 'exchanges.changelly.getMinAmount');

        if (result.error) {
          const retObj = {
            msg: 'error',
            result: result.error,
          };
          res.end(JSON.stringify(retObj));
        } else {
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
  });

  /*
   *  type: GET
   *
   */
  api.get('/exchanges/changelly/order', (req, res, next) => {
    if (api.checkToken(req.query.token)) {
      const _orderId = req.query.orderId;

      console.log(api.exchangesCache.changelly);

      if (api.exchangesCache.changelly[_orderId]) {
        api.log(`changelly order ${_orderId} state is ${api.exchangesCache.changelly[_orderId].status}`, 'exchanges.changelly');

        if (api.changellyStatusLookup.indexOf(api.exchangesCache.changelly[_orderId].status) === -1) {
          api.log(`changelly request order ${_orderId} state update`, 'exchanges.changelly');
          api.changellyGetStatus(res, req, _orderId);
        } else {
          const retObj = {
            msg: 'success',
            result: api.exchangesCache.changelly[_orderId],
          };
          res.end(JSON.stringify(retObj));
        }
      } else {
        api.changellyGetStatus(res, req, _orderId);
      }
    } else {
      const retObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(retObj));
    }
  });

  /*
   *  type: POST
   *
   */
  api.post('/exchanges/cache/changelly/order/delete', (req, res, next) => {
    if (api.checkToken(req.body.token)) {
      delete api.exchangesCache.changelly[req.query.orderId];
      // TODO: remove deposit(s)
      api.saveLocalExchangesCache();

      const retObj = {
        msg: 'success',
        result: api.exchangesCache.changelly,
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

  return api;
};