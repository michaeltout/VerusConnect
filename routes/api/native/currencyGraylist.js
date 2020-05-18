module.exports = (api) => {    
  api.get('/native/get_currency_graylist', (req, res, next) => {
    const { token } = req.body
   
    if (api.checkToken(token)) {
      api.native.loadCurrencyGraylist()
      .then((graylist) => {
        const retObj = {
          msg: 'success',
          result: graylist,
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
    } else {
      const retObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(retObj));
    }
  });
 
  return api;
};