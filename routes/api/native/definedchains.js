const Promise = require('bluebird');

module.exports = (api) => {    
  api.native.get_definedchains = (coin, token) => {
    return new Promise((resolve, reject) => {      
      api.native.callDaemon(coin, 'getdefinedchains', [], token)
      .then((definedchains) => {
        resolve(definedchains)
      })
      .catch(err => {
        reject(err)
      })
    });
  };

  api.post('/native/get_definedchains', (req, res, next) => {
    const token = req.body.token;
    const coin = req.body.chainTicker;

    api.native.get_definedchains(coin, token)
    .then((definedchains) => {
      const retObj = {
        msg: 'success',
        result: definedchains,
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