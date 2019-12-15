const Promise = require('bluebird');

module.exports = (api) => {    
  api.native.revoke_id = (coin, token, name) => {
    return new Promise((resolve, reject) => {      
      api.native.callDaemon(coin, 'revokeidentity', [name], token)
      .then((txid) => {
        resolve({
          name,
          txid
        })
      })
      .catch(err => {
        reject(err)
      })
    });
  };

  api.post('/native/revoke_id', (req, res, next) => {
    const { token, chainTicker, name } = req.body

    api.native.revoke_id(chainTicker, token, name)
    .then((revocationResult) => {
      const retObj = {
        msg: 'success',
        result: revocationResult,
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

  return api
};