const Promise = require('bluebird');

module.exports = (api) => {    
  api.native.get_blocksubsidy = (coin, token, height) => {
    return new Promise((resolve, reject) => {      
      api.native.callDaemon(coin, 'getblocksubsidy', height == null ? [] : [height], token)
      .then((blocksubsidy) => {
        resolve(blocksubsidy)
      })
      .catch(err => {
        reject(err)
      })
    });
  };

  api.post('/native/get_blocksubsidy', (req, res, next) => {
    const { token, height } = req.body
    const coin = req.body.chainTicker;
    
    api.native.get_blocksubsidy(coin, token, height)
    .then((blocksubsidy) => {
      const retObj = {
        msg: 'success',
        result: blocksubsidy,
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