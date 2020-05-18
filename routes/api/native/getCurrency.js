const Promise = require('bluebird');

module.exports = (api) => {    
  api.native.get_currency = (chain, token, name) => {
    return new Promise((resolve, reject) => {      
      api.native.callDaemon(chain, 'getcurrency', [name], token)
      .then((currency) => {
        resolve(currency)
      })
      .catch(err => {
        reject(err)
      })
    });
  };

  api.post('/native/get_currency', (req, res, next) => {
    const { token, chainTicker, name } = req.body

    api.native.get_currency(chainTicker, token, name)
    .then((currency) => {
      const retObj = {
        msg: 'success',
        result: currency,
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