const fs = require('fs-extra');

module.exports = (api) => {
  api.loadCoinsListFromFile = () => {
    try {
      if (fs.existsSync(`${api.agamaDir}/shepherd/coinslist.json`)) {
        const _coinsList = JSON.parse(fs.readFileSync(`${api.agamaDir}/shepherd/coinslist.json`, 'utf8'));

        for (let i = 0; i < _coinsList.length; i++) {
          const _coin = _coinsList[i].selectedCoin.split('|');

          if (_coinsList[i].spvMode.checked) {
            api.addElectrumCoin(_coin[0]);
            api.log(`add spv coin ${_coin[0]} from file`, 'spv.coins');
          }
        }
      }
    } catch (e) {
      api.log(e, 'spv.coins');
    }
  }

  /*
   *  type: GET
   *
   */
  api.get('/coinslist', (req, res, next) => {
    if (api.checkToken(req.query.token)) {
      if (fs.existsSync(`${api.agamaDir}/shepherd/coinslist.json`)) {
        fs.readFile(`${api.agamaDir}/shepherd/coinslist.json`, 'utf8', (err, data) => {
          if (err) {
            const retObj = {
              msg: 'error',
              result: err,
            };

            res.end(JSON.stringify(retObj));
          } else {
            const retObj = {
              msg: 'success',
              result: data ? JSON.parse(data) : '',
            };

            res.end(JSON.stringify(retObj));
          }
        });
      } else {
        const retObj = {
          msg: 'error',
          result: 'coin list doesn\'t exist',
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

  /*
   *  type: POST
   *  params: payload
   */
  api.post('/coinslist', (req, res, next) => {
    if (api.checkToken(req.body.token)) {
      const _payload = req.body.payload;

      if (!_payload) {
        const retObj = {
          msg: 'error',
          result: 'no payload provided',
        };

        res.end(JSON.stringify(retObj));
      } else {
        fs.writeFile(`${api.agamaDir}/shepherd/coinslist.json`, JSON.stringify(_payload), (err) => {
          if (err) {
            const retObj = {
              msg: 'error',
              result: err,
            };

            res.end(JSON.stringify(retObj));
          } else {
            const retObj = {
              msg: 'success',
              result: 'done',
            };

            res.end(JSON.stringify(retObj));
          }
        });
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