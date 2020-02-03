const path = require('path');
const _fs = require('graceful-fs');
const Promise = require('bluebird');
const os = require('os');
const fs = require('fs');

module.exports = (api) => {
  /*
   *  type: POST
   *  params: herd, lastLines
   */
  api.post('/debuglog', (req, res) => {
    if (api.checkToken(req.body.token)) {
      const _platform = os.platform();
      let _herd = req.body.herdname;
      let _ac = req.body.ac;
      let _lastNLines = req.body.lastLines;
      let _location;

      switch (_platform) {
        case 'darwin':
          api.kmdDir = api.appConfig.general.native.dataDir.length ? api.appConfig.general.native.dataDir : `${process.env.HOME}/Library/Application Support/Komodo`;
          break;
        case 'linux':
          api.kmdDir = api.appConfig.general.native.dataDir.length ? api.appConfig.general.native.dataDir : `${process.env.HOME}/.komodo`;
          break;
        case 'win32':
          api.kmdDir = api.appConfig.general.native.dataDir.length ? api.appConfig.general.native.dataDir : `${process.env.APPDATA}/Komodo`;
          api.kmdDir = path.normalize(api.kmdDir);
          break;
      }

      if (_ac && api.appConfig.general.main.reservedChains.indexOf(_ac) === -1) {
        _location = `${api.appConfig.general.main.pbaasTestmode ? api.verusTestDir : api.verusDir}/PBAAS/${_ac}`
      } else if (_herd === 'komodo') {
        _location = api.kmdDir;
      } else if (_ac) {
        _location = `${api.kmdDir}/${_ac}`;

        if (_ac === 'CHIPS') {
          _location = api.chipsDir;
        }
      }

      api.readDebugLog(`${_location}/debug.log`, _lastNLines)
      .then((result) => {
        const retObj = {
          msg: 'success',
          result: result,
        };

        res.end(JSON.stringify(retObj));
      }, (result) => {
        const retObj = {
          msg: 'error',
          result: result,
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
  });

  //TODO: Re-evauluate as POST or eliminate use of API token
  /*api.get('/coind/stdout', (req, res) => {
    if (api.checkToken(req.query.token)) {
      const _daemonName = req.query.chain !== 'komodod' && req.query.chain.toLowerCase() !== 'kmd' ? req.query.chain : 'komodod';
      const _daemonLogName = `${api.agamaDir}/${_daemonName}.log`;

      api.readDebugLog(_daemonLogName, 'all')
      .then((result) => {
        const retObj = {
          msg: 'success',
          result: result,
        };

        res.end(JSON.stringify(retObj));
      }, (result) => {
        const retObj = {
          msg: 'error',
          result: result,
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
  });*/

  api.readDebugLog = (fileLocation, lastNLines) => {
    return new Promise((resolve, reject) => {
      if (lastNLines) {
        try {
          _fs.access(fileLocation, fs.constants.R_OK, (err) => {
            if (err) {
              api.log(`error reading ${fileLocation}`, 'native.debug');
              api.writeLog(`error reading ${fileLocation}`);
              reject(`readDebugLog error: ${err}`);
            } else {
              api.log(`reading ${fileLocation}`, 'native.debug');
              _fs.readFile(fileLocation, 'utf-8', (err, data) => {
                if (err) {
                  api.writeLog(`readDebugLog err: ${err}`, 'native.debug');
                  api.log(`readDebugLog err: ${err}`);
                }

                const lines = data.trim().split('\n');
                let lastLine;

                if (lastNLines === 'all') {
                  lastLine = data.trim();
                } else {
                  lastLine = lines.slice(lines.length - lastNLines, lines.length).join('\n');
                }

                resolve(lastLine);
              });
            }
          });
        } catch (e) {
          reject(`readDebugLog error: ${e}`);
        }
      } else {
        reject('readDebugLog error: lastNLines param is not provided!');
      }
    });
  };

  return api;
};