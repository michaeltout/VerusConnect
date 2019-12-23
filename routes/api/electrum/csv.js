const fs = require('fs-extra');
const request = require('request');
const { secondsToString } = require('agama-wallet-lib/src/time');

// TODO: combine into a single function

module.exports = (api) => {
  //TODO: Re-evauluate as POST or eliminate use of API token
  /*
  api.get('/electrum/listtransactions/csv', (req, res, next) => {
    if (api.checkToken(req.query.token)) {
      api.electrum.get_transactions({
        network: req.query.network,
        coin: req.query.coin,
        address: req.query.address,
        maxlength: api.appConfig.general.electrum.csvListtransactionsMaxLength,
        full: true,
      })
      .then((txhistory) => {
        const _coin = req.query.coin || req.query.network;
        const _time = secondsToString(Date.now() / 1000)
                      .replace(/\s+/g, '_')
                      .replace(/:/g, '-');

        api.log(`csv ${_coin} txhistory length ${txhistory.result.length}`, 'spv.csv');

        if (txhistory.msg === 'success' &&
            txhistory.result &&
            txhistory.result.length) {
          let _csv = ['Direction, Time, Amount, Address, TXID'];

          for (let i = 0; i < txhistory.result.length; i++) {
            _csv.push(`${txhistory.result[i].type}, ` +
                      `${secondsToString(txhistory.result[i].timestamp)}, ` +
                      `${txhistory.result[i].amount}, ${txhistory.result[i].address || ''}, ` +
                      `${txhistory.result[i].txid}`);
          }

          const _fname = `${api.agamaDir}/shepherd/csv/${_coin.toUpperCase()}-${req.query.address}-${_time}.csv`;
          const err = fs.writeFileSync(_fname, _csv.join('\r\n'), 'utf8');

          if (err) {
            const retObj = {
              msg: 'error',
              result: 'can\'t create a file',
            };
            res.end(JSON.stringify(retObj));
          } else {
            const retObj = {
              msg: 'success',
              result: _fname,
            };
            res.end(JSON.stringify(retObj));
          }
        } else {
          res.end(JSON.stringify(txhistory));
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

  //TODO: Re-evauluate as POST or eliminate use of API token
  /*
  api.get('/native/listtransactions/csv', (req, res, next) => {
    if (api.checkToken(req.query.token)) {
      const _coin = req.query.coin;
      const _time = secondsToString(Date.now() / 1000)
                    .replace(/\s+/g, '_')
                    .replace(/:/g, '-');

      const _payload = {
        mode: null,
        chain: _coin,
        cmd: 'listtransactions',
        params: [
          '*',
          api.appConfig.general.native.csvListtransactionsMaxLength,
          0
        ],
        rpc2cli: req.query.rpc2cli || false,
        token: req.query.token,
      };

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
        try {
          const txhistory = JSON.parse(body);

          if (!txhistory.error &&
              !txhistory.id &&
              txhistory.result &&
              txhistory.result.length) {
            api.log(`csv ${_coin} native txhistory length ${txhistory.result.length}`, 'spv.csv');

            let _csv = ['Direction, Time, Amount, Address, TXID'];

            for (let i = 0; i < txhistory.result.length; i++) {
              _csv.push(`${txhistory.result[i].category}, ` +
                        `${secondsToString(txhistory.result[i].time)}, ` +
                        `${txhistory.result[i].amount}, ${txhistory.result[i].address || ''}, ` +
                        `${txhistory.result[i].txid}`);
            }

            const _fname = `${api.agamaDir}/shepherd/csv/${_coin.toUpperCase()}-native-all-${_time}.csv`;
            const err = fs.writeFileSync(_fname, _csv.join('\r\n'), 'utf8');

            if (err) {
              const retObj = {
                msg: 'error',
                result: 'can\'t create a file',
              };
              res.end(JSON.stringify(retObj));
            } else {
              const retObj = {
                msg: 'success',
                result: _fname,
              };
              res.end(JSON.stringify(retObj));
            }
          } else {
            const retObj = {
              msg: 'error',
              result: 'general error or empty transactions list',
            };
            res.end(JSON.stringify(retObj));
          }
        } catch (e) {
          api.log(`csv ${_coin} native txhistory error ${e}`, 'spv.csv');
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