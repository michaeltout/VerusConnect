const Promise = require('bluebird');
const { standardizeMiningInfo } = require('../utils/standardization/standardization')

module.exports = (api) => {    
  api.native.get_mininginfo = (coin, token) => {
    return new Promise((resolve, reject) => {      
      api.native.callDaemon(coin, 'getmininginfo', [], token)
      .then((mininginfo) => {
        resolve(standardizeMiningInfo(mininginfo))
      })
      .catch(err => {
        reject(err)
      })
    });
  };

  api.post('/native/get_mininginfo', (req, res, next) => {
    const token = req.body.token;
    const coin = req.body.chainTicker;

    api.native.get_mininginfo(coin, token)
    .then((mininginfo) => {
      const retObj = {
        msg: 'success',
        result: mininginfo,
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