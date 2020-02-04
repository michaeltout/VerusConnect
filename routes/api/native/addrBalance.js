const Promise = require('bluebird');
const getObjBytes = require('../utils/objectUtil/getBytes')
const {
  RPC_INVALID_ADDRESS_OR_KEY
} = require("../utils/rpc/rpcStatusCodes");
const RpcError = require("../utils/rpc/rpcError");

const BYTES_PER_MB = 1000000

module.exports = (api) => {      
  // Gets an address balance (z_getbalance)
  api.native.get_addr_balance = async (coin, token, address, useCache, txCount) => {
    //TODO: DELETE
    console.log("CACHE ? " + useCache)

    const cacheAddrBalanceResult = (result) => {
      const cacheSize = getObjBytes(api.native.cache);

      if (
        !isNaN(api.appConfig.general.native.nativeCacheMbLimit) &&
        cacheSize <
          api.appConfig.general.native.nativeCacheMbLimit * BYTES_PER_MB
      ) {
        api.native.cache.addr_balance_cache[coin].data[address] = result;

        //TODO: DELETE
        console.log("ADDR BALANCE CACHED");
        console.log(
          `${cacheSize}, ${
            Object.keys(api.native.cache.addr_balance_cache[coin].data).length
          }`
        );
      } else {
        //TODO: DELETE
        console.log('addr cache full')
      }
    }

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
  
        return new Promise((resolve, reject) => {
          if (api.native.cache.addr_balance_cache[coin].data[address] instanceof RpcError) {
            console.log(`GOT ERROR FROM CACHE`)
            reject(api.native.cache.addr_balance_cache[coin].data[address])
          } else resolve(api.native.cache.addr_balance_cache[coin].data[address])
        })
      }
    }
    
    return new Promise((resolve, reject) => {
      api.native
        .callDaemon(coin, "z_getbalance", [address], token)
        .then(balance => {
          if (useCache) cacheAddrBalanceResult(balance)
          resolve(balance);
        })
        .catch(err => {
          //DELET
          console.error(err)

          if (err.code === RPC_INVALID_ADDRESS_OR_KEY) cacheAddrBalanceResult(err)
          
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