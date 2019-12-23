const request = require('request');
const Promise = require('bluebird');
const fs = require('fs-extra');
const _fs = require('graceful-fs');
const fsnode = require('fs');

module.exports = (api) => {
  api.loadLocalExchangesCache = () => {
    if (fs.existsSync(`${api.agamaDir}/exchanges-cache.json`)) {
      const localCache = fs.readFileSync(`${api.agamaDir}/exchanges-cache.json`, 'utf8');

      try {
        api.exchangesCache = JSON.parse(localCache);

        if (!api.exchangesCache.coinswitch) {
          api.exchangesCache = {
            coinswitch: {},
          };
        }

        api.log('local exchanges cache loaded from local file', 'exchanges.cache');
      } catch (e) {
        api.log('local exchanges cache file is damaged, create new', 'exchanges.cache');
        api.exchangesCache = {
          coinswitch: {},
        };
        api.saveLocalExchangesCache();
      }
    } else {
      api.log('local exchanges cache file is not found, create new', 'exchanges.cache');
      api.exchangesCache = {
        coinswitch: {},
      };
      api.saveLocalExchangesCache();
    }
  };

  api.saveLocalExchangesCache = () => {
    _fs.access(api.agamaDir, fs.constants.R_OK, (err) => {
      if (!err) {
        const FixFilePermissions = () => {
          return new Promise((resolve, reject) => {
            const result = 'exchanges-cache.json file permissions updated to Read/Write';

            fsnode.chmodSync(`${api.agamaDir}/exchanges-cache.json`, '0666');

            setTimeout(() => {
              api.log(result, 'exchanges.cache');
              api.writeLog(result);
              resolve(result);
            }, 1000);
          });
        }

        const FsWrite = () => {
          return new Promise((resolve, reject) => {
            const result = 'exchanges-cache.json write file is done';
            const err = fs.writeFileSync(`${api.agamaDir}/exchanges-cache.json`, JSON.stringify(api.exchangesCache), 'utf8');

            if (err)
              return api.log(err, 'exchanges.cache');

            fsnode.chmodSync(`${api.agamaDir}/exchanges-cache.json`, '0666');
            setTimeout(() => {
              api.log(result, 'exchanges.cache');
              api.log(`exchanges-cache.json file is created successfully at: ${api.agamaDir}`, 'exchanges.cache');
              resolve(result);
            }, 2000);
          });
        }

        FsWrite()
        .then(FixFilePermissions());
      }
    });
  }

  /*
   *  type: GET
   *
   */
  api.exchangeHttpReq = (options) => {
    return new Promise((resolve, reject) => {
      request(options, (error, response, body) => {
        if (error) {
          const retObj = {
            msg: 'error',
            result: error,
          };

          resolve(retObj);
          api.log(error, 'exchanges');
        } else {
          try {
            const json = JSON.parse(body);
            const retObj = {
              msg: 'success',
              result: json,
            };

            resolve(retObj);
          } catch (e) {
            api.log(`can\'t parse json from [${options.method}] ${options.url}`, 'exchanges');
            const retObj = {
              msg: 'error',
              result: `can\'t parse json from [${options.method}] ${options.url}`,
            };

            resolve(retObj);
          }
        }
      });
    });
  };

  /*
   *  type: POST
   *
   */
  api.post('/exchanges/cache/delete', (req, res, next) => {
    if (api.checkToken(req.body.token)) {
      api.exchangesCache = {
        coinswitch: {},
      };
      api.saveLocalExchangesCache();

      const retObj = {
        msg: 'success',
        result: 'exchanges cache is removed',
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
  api.get('/exchanges/cache', (req, res, next) => {
    if (api.checkToken(req.query.token)) {
      const provider = req.query.provider;
      const retObj = {
        msg: 'success',
        result: api.exchangesCache[provider] ? api.exchangesCache[provider] : {},
      };

      res.end(JSON.stringify(retObj));

      if (provider === 'coinswitch') {
        for (let key in api.exchangesCache.coinswitch) {
          if (key !== 'deposits') {
            api.log(`coinswitch order ${key} state is ${api.exchangesCache.coinswitch[key].status}`, 'exchanges.coinswitch');

            if (api.exchangesCache.coinswitch[key].status &&
                api.coinswitchStatusLookup.indexOf(api.exchangesCache.coinswitch[key].status) === -1) {
              api.log(`coinswitch request order ${key} state update`, 'exchanges.coinswitch');
              api.coinswitchGetStatus(res, req, key);
            }
          }
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

  /*
   *  type: GET
   *
   */
  /*
  api.get('/exchanges/deposit/update', (req, res, next) => {
    if (api.checkToken(req.query.token)) {
      const provider = req.query.provider;

      if (!api.exchangesCache[provider].deposits) {
        api.exchangesCache[provider].deposits = {};
      }

      api.exchangesCache[provider].deposits[`${req.query.coin.toLowerCase()}-${req.query.txid}`] = req.query.orderId;

      const retObj = {
        msg: 'success',
        result: api.exchangesCache[provider].deposits[`${req.query.coin.toLowerCase()}-${req.query.txid}`],
      };

      res.end(JSON.stringify(retObj));
      api.saveLocalExchangesCache();
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
  api.get('/exchanges/deposit', (req, res, next) => {
    if (api.checkToken(req.query.token)) {
      const provider = req.query.provider;

      if (api.exchangesCache[provider] &&
          api.exchangesCache[provider].deposits &&
          api.exchangesCache[provider].deposits[`${req.query.coin.toLowerCase()}-${req.query.txid}`]) {
        const retObj = {
          msg: 'success',
          result: api.exchangesCache[provider].deposits[`${req.query.coin.toLowerCase()}-${req.query.txid}`],
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
  });*/

  return api;
};