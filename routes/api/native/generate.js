const Promise = require('bluebird');

module.exports = (api) => {    
  api.native.start_mining = (coin, token, numThreads) => {
    return new Promise((resolve, reject) => {      
      api.native.callDaemon(coin, 'setgenerate', [true, numThreads], token)
      .then(() => {        
        resolve(true)
      })
      .catch(err => {
        reject(err)
      })
    });
  };

  api.native.stop_mining = (coin, token) => {
    return new Promise((resolve, reject) => {     
      let staking = false

      api.native.callDaemon(coin, 'getmininginfo', [], token)
      .then((mininginfo) => {
        staking = mininginfo.staking

        return api.native.callDaemon(coin, 'setgenerate', [false], token)
      })
      .then(() => {
        if (staking) {
          return api.native.callDaemon(coin, 'setgenerate', [true, 0], token)
        } else {
          return true
        }
      })
      .then(() => {
        resolve(true)
      })
      .catch(err => {
        reject(err)
      })
    });
  };

  api.native.start_staking = (coin, token) => {
    return new Promise((resolve, reject) => {     
      let numThreads = 0

      api.native.callDaemon(coin, 'getmininginfo', [], token)
      .then((mininginfo) => {
        numThreads = mininginfo.numthreads

        return api.native.callDaemon(coin, 'setgenerate', [true, 0], token)
      })
      .then(() => {
        if (numThreads > 0) {
          return api.native.callDaemon(coin, 'setgenerate', [true, numThreads], token)
        } else {
          return true
        }
      })
      .then(() => {
        resolve(true)
      })
      .catch(err => {
        reject(err)
      })
    });
  };

  api.native.stop_staking = (coin, token) => {
    return new Promise((resolve, reject) => {     
      let numThreads = 0

      api.native.callDaemon(coin, 'getmininginfo', [], token)
      .then((mininginfo) => {
        numThreads = mininginfo.numthreads

        return api.native.callDaemon(coin, 'setgenerate', [false], token)
      })
      .then(() => {
        if (numThreads > 0) {
          return api.native.callDaemon(coin, 'setgenerate', [true, numThreads], token)
        } else {
          return true
        }
      })
      .then(() => {
        resolve(true)
      })
      .catch(err => {
        reject(err)
      })
    });
  };

  api.post('/native/start_mining', (req, res, next) => {
    const { token, chainTicker, numThreads } = req.body

    api.native.start_mining(chainTicker, token, numThreads)
    .then(() => {
      const retObj = {
        msg: 'success',
        result: null,
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

  api.post('/native/start_staking', (req, res, next) => {
    const { token, chainTicker } = req.body

    api.native.start_staking(chainTicker, token)
    .then(() => {
      const retObj = {
        msg: 'success',
        result: null,
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

  api.post('/native/stop_mining', (req, res, next) => {
    const { token, chainTicker } = req.body

    api.native.stop_mining(chainTicker, token)
    .then(() => {
      const retObj = {
        msg: 'success',
        result: null,
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

  api.post('/native/stop_staking', (req, res, next) => {
    const { token, chainTicker } = req.body

    api.native.stop_staking(chainTicker, token)
    .then(() => {
      const retObj = {
        msg: 'success',
        result: null,
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