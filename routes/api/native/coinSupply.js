const Promise = require('bluebird');

module.exports = (api) => {  
  /* loadingState = {
    status: 'loading',
    totalBlocks: <number of blocks in longest chain>,
    loadedBlocks: <number of blocks cached so far>,
    timeTaken: <time taken for last loading tick>
  }*/

  api.native.coinSupplyLoadingStates = {}

  api.native.get_coinsupply = (coin, token, height) => {
    return new Promise((resolve, reject) => {
      api.native.callDaemon(coin, 'coinsupply', height == null ? [] : [height.toString()], token)
      .then((coinSupply) => {
        if (coinSupply.error != null) reject(new Error(coinSupply.error))
        
        resolve(coinSupply)
      })
      .catch(err => {
        reject(err)
      })
    });
  };

  api.native.get_currentsupply = (coin, token) => {
    const loadingState = api.native.coinSupplyLoadingStates[coin]

    const loadSupply = (loadingState) => {
      // Record time before fetch started
      const preTs = new Date().getTime()

      api.native
        .get_info(coin, token)
        .then(chainInfo => {
          const { longestchain, blocks } = chainInfo;

          if (longestchain != blocks) throw new Error('Cannot get coin supply, still syncing...')

          loadingState.totalBlocks = longestchain;
          loadingState.loadedBlocks =
            loadingState.loadedBlocks == null
              ? 5000
              : loadingState.loadedBlocks + 5000;

          return api.native.get_coinsupply(
            coin,
            token,
            loadingState.loadedBlocks
          );
        })
        .then(coinSupply => {
          // We dont need to use coinsupply data, we are just doing this to cache it

          const blockDiff =
            loadingState.totalBlocks - loadingState.loadedBlocks;
          loadingState.status =
            blockDiff < 5000 && blockDiff > 0 ? "ready" : "loading";

          // Calculate time taken to get coins supply for 5000 blocks and set timeout to repeat next 5000 block
          // in that time if still loading(to avoid clogging up daemon)
          loadingState.timeTaken = new Date().getTime() - preTs;

          api.native.coinSupplyLoadingStates[coin] = loadingState;

          if (loadingState.status == "loading") {
            setTimeout(() => loadSupply(loadingState), loadingState.timeTaken);
          }
        })
        .catch(e => {
          loadingState.status = "error";
          api.log(e.message, 'coinSupply');
          api.native.coinSupplyLoadingStates[coin] = loadingState;
        });
    }

    // If process of caching coin supply hasnt begun, start caching coin supply
    if (loadingState == null || loadingState.status === 'error') {
      loadSupply({
        status: 'loading',
        totalBlocks: null,
        loadedBlocks: null,
        timeTaken: null
      })
    } else if (loadingState.status === 'ready') {
      return new Promise((resolve, reject) => {
        api.native.get_coinsupply(coin, token)
        .then(coinSupply => {
          resolve({ ...coinSupply, loadingState, source: 'native' })
        })
        .catch(e => reject(e))
      })
    }

    return new Promise((resolve, reject) => {
      api.get_coinsupply(coin)
      .then(coinSupply => {
        resolve({ ...coinSupply, loadingState, source: 'http/https' })
      })
      .catch(e => {
        if (e.message.includes('HTTP/HTTPS coin supply function not found')) {
          reject(new Error('Loading...'))
        } else {
          reject(e)
        }
      })
    })
  }

  api.post('/native/get_currentsupply', (req, res, next) => {
    const token = req.body.token;
    const coin = req.body.chainTicker;

    api.native.get_currentsupply(coin, token)
    .then((coinSupply) => {
      const retObj = {
        msg: 'success',
        result: coinSupply,
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