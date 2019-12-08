const fs = require('fs-extra');
const path = require('path');

module.exports = (api) => {
  /*
   *  type: GET
   *  params: coin, type
   */
  api.get('/kick', (req, res, next) => {
    if (api.checkToken(req.query.token)) {
      const _coin = req.query.coin;
      const _keepWallet = req.query.keepwallet;

      if (!_coin) {
        const retObj = {
          msg: 'error',
          result: 'no coin name provided',
        };

        res.end(JSON.stringify(retObj));
      } else {
        const _location = path.join(_coin === 'KMD' ? api.komodoDir : `${api.komodoDir}/${_coin}`);

        if (fs.existsSync(_location)) {
          const items = fs.readdirSync(_location);

          for (let i = 0; i < items.length; i++) {
            if (items[i].indexOf('wallet.dat') === -1) {
              fs.removeSync(`${_location}/${items[i]}`);
            } else if (!_keepWallet) {
              fs.removeSync(`${_location}/${items[i]}`);
            }
          }
        }

        const retObj = {
          msg: 'success',
          result: `${_coin} native is kicked`,
        };

        res.end(JSON.stringify(retObj));
      }
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