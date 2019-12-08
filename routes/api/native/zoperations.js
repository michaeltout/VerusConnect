const Promise = require('bluebird');

module.exports = (api) => {    
  api.native.get_zoperations = (coin, token) => {
    return new Promise((resolve, reject) => {      
      api.native.callDaemon(coin, 'z_getoperationstatus', [], token)
      .then((zoperations) => {
        resolve(zoperations)
      })
      .catch(err => {
        reject(err)
      })
    });
  };

  api.post('/native/get_zoperations', (req, res, next) => {
    const token = req.body.token;
    const coin = req.body.chainTicker;

    api.native.get_zoperations(coin, token)
    .then((zoperations) => {
      const retObj = {
        msg: 'success',
        result: zoperations,
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