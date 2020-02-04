const Promise = require('bluebird');
const getObjBytes = require('../utils/objectUtil/getBytes')

const BYTES_PER_MB = 1000000

module.exports = (api) => {      
  // Gets an address balance (z_getbalance)
  api.native.get_addr_balance = async (coin, token, address, useCache, txCount) => {
    //TODO: DELETE
    console.log("CACHE ? " + useCache)

    if (useCache) {
      if (
        api.native.cache.addr_balance_cache[coin] != null &&
        txCount !== api.native.cache.addr_balance_cache[coin].tx_count
      ) {
        //TODO: DELETE
        console.log(`Transaction count changed, clearing ${coin} address balance cache`)
  
        api.native.cache.addr_balance_cache[coin].tx_count = txCount;
        delete api.native.cache.addr_balance_cache[coin].data;
      }
        
      if (api.native.cache.addr_balance_cache[coin] == null) {
        api.native.cache.addr_balance_cache[coin] = {
          tx_count: -1,
          data: {}
        };
      } else if (api.native.cache.addr_balance_cache[coin].data == null) {
        api.native.cache.addr_balance_cache[coin].data = {}
      }
  
      if (api.native.cache.addr_balance_cache[coin].data[address] != null) {
        //TODO: DELETE
        console.log(`Used cached address balance for ${coin}, ${address}`)
  
        return new Promise((resolve, reject) => resolve(api.native.cache.addr_balance_cache[coin].data[address]))
      }
    }
    
    return new Promise((resolve, reject) => {
      api.native
        .callDaemon(coin, "z_getbalance", [address], token)
        .then(balance => {
          const cacheSize = getObjBytes(api.native.cache);

          if (useCache) {
            if (
              !isNaN(api.appConfig.general.native.nativeCacheMbLimit) &&
              cacheSize <
                api.appConfig.general.native.nativeCacheMbLimit * BYTES_PER_MB
            ) {
              api.native.cache.addr_balance_cache[coin].data[address] = balance;
            }
          }

          //TODO: DELETE
          console.log("ADDR BALANCE CACHED");
          console.log(
            `${cacheSize}, ${
              Object.keys(api.native.cache.addr_balance_cache[coin].data).length
            }`
          );

          resolve(balance);
        })
        .catch(err => {
          reject(err);
        });
    });
  };

  /*api.post('/native/get_transaction', (req, res, next) => {
    const token = req.body.token;
    const coin = req.body.chainTicker;
    const txid = req.body.txid;
    const compact = req.body.compact;

    api.native.get_transaction(coin, token, txid, compact)
    .then((txObj) => {
      const retObj = {
        msg: 'success',
        result: txObj,
      };
  
      res.end(JSON.stringify(retObj));  
    })
    .catch(error => {
      const retObj = {
        msg: 'error',
        result: error.message,
      };
  
      res.end(JSON.stringify(retObj));  
    })
  });*/

  return api;
};