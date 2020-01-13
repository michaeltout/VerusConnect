const fs = require('fs-extra');
const Promise = require('bluebird');
const { secondsToString } = require('agama-wallet-lib/src/time');

module.exports = (api) => {
  api.log = (msg, type) => {
    if (api.appConfig.general.main.dev ||
        api.appConfig.general.main.debug ||
        process.argv.indexOf('devmode') > -1) {
      if (type) {
        console.log(`\x1b[94m${type}`, '\x1b[0m', msg);
      } else {
        console.log(msg);
      }
    }

    api.appRuntimeLog.push({
      time: Date.now(),
      msg: msg,
      type: type,
    });
  }

  api.writeLog = (data) => {
    const logLocation = `${api.agamaDir}/shepherd`;
    const timeFormatted = new Date(Date.now()).toLocaleString('en-US', { hour12: false });

    if (api.appConfig.general.main.debug) {
      if (fs.existsSync(`${logLocation}/agamalog.txt`)) {
        fs.appendFile(`${logLocation}/agamalog.txt`, `${timeFormatted}  ${data}\r\n`, (err) => {
          if (err) {
            api.log('error writing log file');
          }
        });
      } else {
        fs.writeFile(`${logLocation}/agamalog.txt`, `${timeFormatted}  ${data}\r\n`, (err) => {
          if (err) {
            api.log('error writing log file');
          }
        });
      }
    }
  }

  //TODO: Re-evauluate as POST or eliminate use of API token
  /*
  api.get('/log/runtime', (req, res, next) => {
    if (api.checkToken(req.query.token)) {
      let _res = JSON.parse(JSON.stringify(api.appRuntimeLog));
      let _searchTerm = req.query.term;
      let _logType = req.query.type;

      if (_logType) {
        _res = _res.filter(req.query.typeExact ? item => item.type === _logType : item => item.type.indexOf(_logType) > -1);
      }

      if (_searchTerm) {
        let _searchRes = [];

        for (let i = 0; i < _res.length; i++) {
          if (JSON.stringify(_res[i].msg).indexOf(_searchTerm) > -1) {
            _searchRes.push(_res[i]);
          }
        }

        if (_searchRes.length) {
          const retObj = {
            msg: 'success',
            result: _searchRes,
          };

          res.end(JSON.stringify(retObj));
        } else {
          const retObj = {
            msg: 'success',
            result: 'can\'t find any matching for ' + _searchTerm,
          };

          res.end(JSON.stringify(retObj));
        }
      } else {
        const retObj = {
          msg: 'success',
          result: _res,
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
  });*/

  //TODO: Re-evauluate as POST or eliminate use of API token
  /*
  api.get('/log/runtime/dump', (req, res, next) => {
    if (api.checkToken(req.query.token)) {
      if (req.query.stringify) {
        const retObj = {
          msg: 'success',
          result: JSON.stringify(api.appRuntimeLog),
        };
        res.end(JSON.stringify(retObj));
      } else {
        const _log = JSON.parse(JSON.stringify(api.appRuntimeLog));
        const _time = secondsToString(Date.now() / 1000).replace(/\s+/g, '-');

        const err = fs.writeFileSync(
          `${api.agamaDir}/shepherd/log/log-${_time}.json`,
          JSON.stringify(_log),
          'utf8'
        );

        if (err) {
          const retObj = {
            msg: 'error',
            result: 'can\'t create a file',
          };
          res.end(JSON.stringify(retObj));
        } else {
          const retObj = {
            msg: 'success',
            result: `${api.agamaDir}/shepherd/log/log-${_time}.json`,
          };
          res.end(JSON.stringify(retObj));
        }
      }
    } else {
      const retObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(retObj));
    }
  });*/

  api.getAppRuntimeLog = () => {
    return new Promise((resolve, reject) => {
      resolve(api.appRuntimeLog);
    });
  };

  /*  needs a fix
   *  type: POST
   *  params: payload
   */
  /* api.post('/guilog', (req, res, next) => {
    if (api.checkToken(req.body.token)) {
      const logLocation = `${api.agamaDir}/shepherd`;
      const timestamp = req.body.timestamp;

      if (!api.guiLog[api.appSessionHash]) {
        api.guiLog[api.appSessionHash] = {};
      }

      if (api.guiLog[api.appSessionHash][timestamp]) {
        api.guiLog[api.appSessionHash][timestamp].status = req.body.status;
        api.guiLog[api.appSessionHash][timestamp].response = req.body.response;
      } else {
        api.guiLog[api.appSessionHash][timestamp] = {
          function: req.body.function,
          type: req.body.type,
          url: req.body.url,
          payload: req.body.payload,
          status: req.body.status,
        };
      }

      fs.writeFile(`${logLocation}/agamalog.json`, JSON.stringify(api.guiLog), (err) => {
        if (err) {
          api.writeLog('error writing gui log file');
        }

        const retObj = {
          msg: 'success',
          result: 'gui log entry is added',
        };

        res.end(JSON.stringify(retObj));
      });
    } else {
      const retObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(retObj));
    }
  }); */

  /*
   *  type: GET
   *  params: type
   */

  //TODO: Re-evauluate as POST or eliminate use of API token
  /*
  api.get('/getlog', (req, res, next) => {
    if (api.checkToken(req.query.token)) {
      const logExt = req.query.type === 'txt' ? 'txt' : 'json';

      if (fs.existsSync(`${api.agamaDir}/shepherd/agamalog.${logExt}`)) {
        fs.readFile(`${api.agamaDir}/shepherd/agamalog.${logExt}`, 'utf8', (err, data) => {
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
          result: `agama.${logExt} doesnt exist`,
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
  });*/

  api.printDirs = () => {
    api.log(`agama dir: ${api.agamaDir}`, 'env');
    api.log('--------------------------', 'env')
    api.log(`komodo dir: ${api.komododBin}`, 'env');
    api.log(`komodo bin: ${api.komodoDir}`, 'env');
    api.writeLog(`agama dir: ${api.agamaDir}`);
    api.writeLog(`komodo dir: ${api.komododBin}`);
    api.writeLog(`komodo bin: ${api.komodoDir}`);
  }

  return api;
};