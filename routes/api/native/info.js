const Promise = require('bluebird');
const { standardizeInfo } = require('../utils/standardization/standardization')

module.exports = (api) => {    
  api.native.get_info = (coin, token) => {
    return new Promise((resolve, reject) => {      
      api.native.callDaemon(coin, 'getinfo', [], token)
      .then((info) => {
        return standardizeInfo(info, coin, api)
      })
      .then(info => resolve(info))
      .catch(err => {
        reject(err)
      })
    });
  };

  api.post('/native/get_info', (req, res, next) => {
    const token = req.body.token;
    const coin = req.body.chainTicker;

    api.native.get_info(coin, token)
    .then((info) => {
      const retObj = {
        msg: 'success',
        result: info,
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