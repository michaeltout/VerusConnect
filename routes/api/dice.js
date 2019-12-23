const Promise = require('bluebird');
const request = require('request');

module.exports = (api) => {
  /*
   *  Combined dicelist + diceinfo method
   *  type: GET
   *  params: coin
   */
  //TODO: Re-evauluate as POST or eliminate use of API token
  /*api.get('/native/dice/list', (req, res, next) => {
    if (api.checkToken(req.query.token)) {
      const _coin = req.query.coin;
      const _token = req.query.token;
      let _returnObj;
      let _promiseStack;

      _returnObj = {
        dicelist: [],
      };
      _promiseStack = [
        'getinfo',
        'listtransactions',
        'z_gettotalbalance',
        'z_getoperationstatus',
      ];

      const _bitcoinRPC = (coin, cmd, params) => {
        return new Promise((resolve, reject) => {
          let _payload;

          if (params) {
            _payload = {
              mode: null,
              chain: coin,
              cmd: cmd,
              params: params,
              rpc2cli: req.body.rpc2cli,
              token: _token,
            };
          } else {
            _payload = {
              mode: null,
              chain: coin,
              cmd: cmd,
              rpc2cli: req.body.rpc2cli,
              token: _token,
            };
          }

          const options = {
            url: `http://127.0.0.1:${api.appConfig.general.main.agamaPort}/api/cli`,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ payload: _payload }),
            timeout: 120000,
          };

          request(options, (error, response, body) => {
            resolve(body);
          });
        });
      }

      // get dicelist
      _bitcoinRPC(
        _coin,
        'dicelist',
        []
      )
      .then((json) => {
        if (json === 'Work queue depth exceeded' ||
            !json) {
          _returnObj[_call] = { error: 'daemon is busy' };
        } else {
          const _jsonParsed = JSON.parse(json);
          let _items = [];

          if (_jsonParsed &&
              _jsonParsed.result &&
              _jsonParsed.result.length) {
            Promise.all(_jsonParsed.result.map((_diceItem, index) => {
              return new Promise((resolve, reject) => {
                _bitcoinRPC(
                  _coin,
                  'diceinfo',
                  [_diceItem]
                )
                .then((_json) => {
                  resolve(true);
                  
                  if (_json === 'Work queue depth exceeded' ||
                      !_json) {
                    api.log('dice unable to get diceinfo ' + _diceItem, 'native');
                  } else {
                    const __jsonParsed = JSON.parse(_json);

                    if (__jsonParsed &&
                        __jsonParsed.result &&
                        __jsonParsed.result.fundingtxid) {
                      _items.push(__jsonParsed.result);
                    }
                  }
                });
              });
            }))
            .then(result => {
              const retObj = {
                msg: 'success',
                result: _items,
              };
        
              res.end(JSON.stringify(retObj));
            });
          }
        }
      });
    } else {
      const retObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(retObj));
    }
  });*/

  return api;
};