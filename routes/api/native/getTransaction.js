const Promise = require('bluebird');
const getObjBytes = require('../utils/objectUtil/getBytes')

const TX_CONFIRMATION_CACHE_THRESHOLD = 100
const BYTES_PER_MB = 1000000

module.exports = (api) => {      
  // Gets a transaction, with the option of compacting it to to be 
  // a small JSON of essential data (required if cached)
  // The currentheight helps calculate the # of confirmations for 
  // cached transactions. Without it, confirmations will be returned as null.
  // (in this case tx height will be appended to tx obj)
  api.native.get_transaction = async (coin, token, txid, compact, currentHeight) => {
    if (api.native.cache.tx_cache[coin] == null) api.native.cache.tx_cache[coin] = {}

    if (compact && api.native.cache.tx_cache[coin][txid] != null) {
      return new Promise((resolve, reject) => {
        const cachedTx = api.native.cache.tx_cache[coin][txid]
        const { blockheight } = cachedTx

        api.native.cache.tx_cache[coin][txid] = {
          ...cachedTx,
          confirmations:
            currentHeight == null ||
            blockheight == null ||
            currentHeight - blockheight < 0
              ? null
              : currentHeight - blockheight
        }

        resolve(api.native.cache.tx_cache[coin][txid]);
      })
    }

    return new Promise((resolve, reject) => {      
      api.native.callDaemon(coin, 'gettransaction', [txid], token)
      .then(async (tx) => {
        if (compact) {
          const cacheSize = getObjBytes(api.native.cache)
          const {
            amount,
            fee,
            confirmations,
            blockhash,
            blockindex,
            blocktime,
            expiryheight,
            walletconflicts,
            time,
            timereceived,
            details
          } = tx

          const compactTx = {
            amount,
            fee,
            confirmations,
            blockhash,
            blockindex,
            blocktime,
            expiryheight,
            walletconflicts,
            time,
            timereceived,
            txid,
            details
          }

          if (tx.confirmations > TX_CONFIRMATION_CACHE_THRESHOLD) {
            if (
              !isNaN(api.appConfig.general.native.nativeCacheMbLimit) &&
              cacheSize <
                api.appConfig.general.native.nativeCacheMbLimit * BYTES_PER_MB
            ) {
              let txBlock = await api.native.callDaemon(
                coin,
                "getblock",
                [blockhash],
                token
              )
              
              api.native.cache.tx_cache[coin][txid] = {
                ...compactTx,
                blockheight: txBlock.height
              };
            }
            //TODO: Add in smart caching here
          }
         
          resolve(compactTx)
        } else resolve(tx)
      })
      .catch(err => {
        reject(err)
      })
    });
  };

  api.post('/native/get_transaction', (req, res, next) => {
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
  });

  return api;
};