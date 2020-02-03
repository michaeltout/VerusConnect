const Promise = require('bluebird');
const getObjBytes = require('../utils/objectUtil/getBytes')

const BYTES_PER_MB = 1000000

module.exports = (api) => {      
  // Gets an address balance (z_getbalance)
  api.native.get_addr_balance = async (coin, token, address) => {
    if (api.native.cache.addr_balance_cache[coin] == null) api.native.cache.addr_balance_cache[coin] = {}
    const addrCache = api.native.cache.addr_balance_cache[coin]

    if (addrCache[address] != null) {
      //TODO: DELETE
      console.log(`Used cached address balance for ${coin}, ${address}`)

      return new Promise((resolve, reject) => resolve(addrCache[address]))
    }

    return new Promise((resolve, reject) => {      
      api.native.callDaemon(coin, 'z_getbalance', [address], token)
      .then((balance) => {
        const cacheSize = getObjBytes(api.native.cache)

        if (
          !isNaN(api.appConfig.general.native.nativeCacheMbLimit) &&
          cacheSize <
            api.appConfig.general.native.nativeCacheMbLimit * BYTES_PER_MB
        ) {
          addrCache[address] = balance;
        } else {
          //TODO: DELETE
          console.log("addr balance cache size limit exceeded, deleting and adding addr");

          delete addrCache[Object.keys(addrCache)[0]]
          addrCache[address] = balance;
        }

        //TODO: DELETE
        console.log("ADDR BALANCE CACHE")
        console.log(
          `${cacheSize}, ${
            Object.keys(addrCache).length
          }`
        );

        
        resolve(balance)
      })
      .catch(err => {
        reject(err)
      })
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