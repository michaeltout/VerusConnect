// DEPRECATED, TODO: REMOVE

/*const portscanner = require('portscanner');
const execFile = require('child_process').execFile;

module.exports = (api) => {
  api.quitKomodod = (timeout = 30000) => {
    // if komodod is under heavy load it may not respond to cli stop the first time
    // exit komodod gracefully
    let coindExitInterval = {};
    api.lockDownAddCoin = true;

    for (let key in api.coindInstanceRegistry) {
      if (api.appConfig.general.native.stopNativeDaemonsOnQuit) {
        const chain = key !== 'komodod' ? key : null;
        let _coindQuitCmd = api.appConfig.general.main.reservedChains.indexOf(key) === -1 ? api.veruscliBin : api.komodocliBin;

         // any coind
        if (api.nativeCoindList[key.toLowerCase()]) {
          _coindQuitCmd = `${api.coindRootDir}/${key.toLowerCase()}/${api.nativeCoindList[key.toLowerCase()].bin.toLowerCase()}-cli`;
        }
        if (key === 'CHIPS') {
          _coindQuitCmd = api.chipscliBin;
        }

        const execCliStop = () => {
          let _arg = [];

          if (chain &&
              !api.nativeCoindList[key.toLowerCase()] &&
              key !== 'CHIPS') {
            _arg.push(`-ac_name=${chain}`);

            if (api.appConfig.general.native.dataDir.length) {
              _arg.push(`-datadir=${api.appConfig.general.native.dataDir + (key !== 'komodod' ? '/' + key : '')}`);
            }
          } else if (
            key === 'komodod' &&
            api.appConfig.general.native.dataDir.length
          ) {
            _arg.push(`-datadir=${api.appConfig.general.native.dataDir}`);
          }

          _arg.push('stop');
          execFile(`${_coindQuitCmd}`, _arg, (error, stdout, stderr) => {
            api.log(`stdout: ${stdout}`, 'native.debug');
            api.log(`stderr: ${stderr}`, 'native.debug');
            api.log(`send stop sig to ${key}`, 'native.process');

            if (error !== null) {
              api.log(`exec error: ${error}`, 'native.process');
            }
          });
        }

        const didDaemonQuit = () => {
          // workaround for AGT-65
          const _port = api.assetChainPorts[key];
            portscanner.checkPortStatus(_port, '127.0.0.1', (error, status) => {
              // Status is 'open' if currently in use or 'closed' if available
              if (status === 'closed') {
                api.log(`${key} shut down succesfully, cleaning up...`, 'native.process');
                delete api.coindInstanceRegistry[key];
                delete api.native.startParams[key];
                clearInterval(coindExitInterval[key]);
              } else {
                api.log(`${key} is still running...`, 'native.process');
              }
            });
        }

        api.log(`trying to safely quit ${key}`, 'native.process');
        execCliStop();
        setInterval(() => {
          execCliStop();
        }, timeout)
        coindExitInterval[key] = setInterval(() => {
          api.log(`Checking if ${key} has quit...`, 'native.process');
          didDaemonQuit();
        }, 1000);
      } else {
        delete api.coindExitInterval[key];
      }
    }
  }

  api.post('/native/stop', (req, res) => {
    if (api.checkToken(req.body.token)) {
      const _chain = req.body.chainTicker;
      let _coindQuitCmd = _chain && api.appConfig.general.main.reservedChains.indexOf(_chain) === -1 ? api.veruscliBin : api.komodocliBin;
      let _arg = [];


      if (_chain) {
        _arg.push(`-ac_name=${_chain}`);

        if (api.appConfig.general.native.dataDir.length) {
          _arg.push(`-datadir=${api.appConfig.general.native.dataDir + (_chain ? '/' + _chain : '')}`);
        }
      } else if (
        !_chain &&
        api.appConfig.general.native.dataDir.length
      ) {
        _arg.push(`-datadir=${api.appConfig.general.native.dataDir}`);
      }

      _arg.push('stop');
      execFile(`${_coindQuitCmd}`, _arg, (error, stdout, stderr) => {
        api.log(`stdout: ${stdout}`, 'native.debug');
        api.log(`stderr: ${stderr}`, 'native.debug');
        api.log(`send stop sig to ${_chain ? _chain : 'komodo'}`, 'native.process');

        if (stdout.indexOf('EOF reached') > -1 ||
            stderr.indexOf('EOF reached') > -1 ||
            (error && error.toString().indexOf('Command failed') > -1 && !stderr) || // win "special snowflake" case
            stdout.indexOf('connect to server: unknown (code -1)') > -1 ||
            stderr.indexOf('connect to server: unknown (code -1)') > -1) {
          delete api.coindInstanceRegistry[_chain ? _chain : 'komodod'];
          delete api.native.startParams[_chain ? _chain : 'komodod'];

          const retObj = {
            msg: 'success',
            result: 'result',
          };

          res.end(JSON.stringify(retObj));
        } else {
          if (stdout.indexOf('Komodo server stopping') > -1) {
            delete api.coindInstanceRegistry[_chain ? _chain : 'komodod'];
            delete api.native.startParams[_chain ? _chain : 'komodod'];
            
            const retObj = {
              msg: 'success',
              result: 'result',
            };

            res.end(JSON.stringify(retObj));
          } else {
            const retObj = {
              msg: 'error',
              result: 'result',
            };

            res.end(JSON.stringify(retObj));
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
  });

  api.post('/coins/remove', (req, res) => {
    if (api.checkToken(req.body.token)) {
      const _chain = req.body.chain;

      if (req.body.mode === 'native') {
        delete api.coindInstanceRegistry[_chain ? _chain : 'komodod'];
        delete api.native.startParams[_chain ? _chain : 'komodod'];

        const retObj = {
          msg: 'success',
          result: true,
        };

        res.end(JSON.stringify(retObj));
      } else if (req.body.mode === 'spv') {
        delete api.electrum.coinData[_chain.toLowerCase()];

        if (Object.keys(api.electrum.coinData).length - 1 === 0) {
          api.electrumKeys = {};
        }

        const retObj = {
          msg: 'success',
          result: true,
        };

        res.end(JSON.stringify(retObj));
      } else if (req.body.mode === 'eth') {
        delete api.eth.coins[_chain.toUpperCase()];
        
        if (Object.keys(api.eth.coins).length === 0) {
          api.eth.coins = null;
          api.eth.wallet = null;
          api.eth.connect = null;
        }

        const retObj = {
          msg: 'success',
          result: true,
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
*/