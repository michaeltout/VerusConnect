const async = require('async');

module.exports = (api) => {  
  api.get('/eth/erc20/decimals/all', (req, res, next) => {
    const retObj = {
      msg: 'success',
      result: 'true',
    };

    res.end(JSON.stringify(retObj));
    let _items = [];

    for (let key in erc20ContractId) {
      _items.push(key);
    }

    async.eachOfSeries(_items, (key, ind, callback) => {
      setTimeout(() => {
        api.eth._tokenInfo(key.toUpperCase())
        .then((tokenInfo) => {
          if (tokenInfo &&
              tokenInfo.decimals) {
            console.log(`${key.toUpperCase()}: ${tokenInfo.decimals},`);
          } else {
            console.log(`${key.toUpperCase()}: error`);
          }
          callback();
        });
      }, 2000);
    });
  });

  return api;
};