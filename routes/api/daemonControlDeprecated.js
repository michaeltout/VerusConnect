/*const spawn = require('child_process').spawn;
const fs = require('fs-extra');
const _fs = require('graceful-fs');
const fsnode = require('fs');
const path = require('path');
const os = require('os');
const portscanner = require('portscanner');
const execFile = require('child_process').execFile;
const Promise = require('bluebird');
const md5 = require('agama-wallet-lib/src/crypto/md5');

module.exports = (api) => {
  const getConf = (flock, coind) => {
    const _platform = os.platform();
    let DaemonConfPath = '';
    let pbaasCoinDir;

    if (flock === 'CHIPS') {
      flock = 'chipsd';
    }

    api.log(flock, 'native.confd');
    api.log(`getconf coind ${coind}`, 'native.confd');
    api.writeLog(`getconf flock: ${flock}`, 'native.confd');

    /*if (coind) {
      switch (_platform) {
        case 'darwin':
          nativeCoindDir = `${process.env.HOME}/Library/Application Support/${api.nativeCoindList[coind.toLowerCase()].bin}`;
          break;
        case 'linux':
          nativeCoindDir = coind ? `${process.env.HOME}/.${api.nativeCoindList[coind.toLowerCase()].bin.toLowerCase()}` : null;
          break;
        case 'win32':
          nativeCoindDir = coind ? `${process.env.APPDATA}/${api.nativeCoindList[coind.toLowerCase()].bin}` : null;
          break;
      }
    }

    //If the coin uses verusd as it's daemon and isn't Verus, we assume it's
    //directory will lie in PBaaS territory, outside of the kmdDir
    if (api.appConfig.general.main.reservedChains.indexOf(flock) === -1) {
      if (api.appConfig.general.main.pbaasTestmode) {
        pbaasCoinDir = path.normalize(path.join(api.verusTestDir, `/PBAAS/${flock}`));
        api.log(`Assuming PBAAS chain in test mode, using conf path as ${pbaasCoinDir}`, 'native.confd');
      } else {
        pbaasCoinDir = path.normalize(path.join(api.verusDir, `/PBAAS/${flock}`));
        api.log(`Assuming PBAAS chain, using conf path as ${pbaasCoinDir}`, 'native.confd');
      }

      return pbaasCoinDir;
    }

    switch (flock) {
      case 'komodod':
        DaemonConfPath = api.kmdDir;
        if (_platform === 'win32') {
          DaemonConfPath = path.normalize(DaemonConfPath);
          api.log('===>>> API OUTPUT ===>>>', 'native.confd');
        }
        break;
      case 'zcashd':
        DaemonConfPath = api.ZcashDir;
        if (_platform === 'win32') {
          DaemonConfPath = path.normalize(DaemonConfPath);
        }
        break;
      case 'chipsd':
        DaemonConfPath = api.chipsDir;
        if (_platform === 'win32') {
          DaemonConfPath = path.normalize(DaemonConfPath);
        }
        break;
      case 'coind':
        DaemonConfPath = _platform === 'win32' ? path.normalize(`${api.coindRootDir}/${coind.toLowerCase()}`) : `${api.coindRootDir}/${coind.toLowerCase()}`;
        break;
      default:
        DaemonConfPath = `${api.kmdDir}/${flock}`;
        if (_platform === 'win32') {
          DaemonConfPath = path.normalize(DaemonConfPath);
        }
    }

    api.writeLog(`getconf path: ${DaemonConfPath}`);
    api.log(`daemon path: ${DaemonConfPath}`, 'native.confd');

    return DaemonConfPath;
  }

  // TODO: json.stringify wrapper

  const herder = (flock, data, coind) => {
    let acDaemon = false

    if (data === undefined) {
      data = 'none';
      api.log('No data to start daemon with', 'native.confd');
    } else if (data.ac_daemon != undefined && data.ac_daemon != 'komodod') {
      flock = data.ac_daemon;
      acDaemon = true;
      api.customPathsDaemons(flock);
    }

    api.log(`herder flock: ${flock} coind: ${coind}`, 'native.confd');
    api.log(`selected data: ${JSON.stringify(data, null, '\t')}`, 'native.confd');

    // TODO: notify gui that reindex/rescan param is used to reflect on the screen
    //       asset chain debug.log unlink
    if (flock === 'komodod' || acDaemon) {
      let kmdDebugLogLocation
      let _coindConf
      
      //If these conditions pass, we can assume PBaaS chain
      if (acDaemon && data.ac_daemon === 'verusd' && (api.appConfig.general.main.reservedChains.indexOf(data.ac_name) === -1)) {
        kmdDebugLogLocation = `${api.appConfig.general.main.pbaasTestmode ? api.verusTestDir : api.verusDir}/PBAAS/${data.ac_name}/debug.log`;
        _coindConf = `${api.appConfig.general.main.pbaasTestmode ? api.verusTestDir : api.verusDir}/PBAAS/${data.ac_name}/${data.ac_name}.conf`;
        api.log(`Assuming PBAAS chain, using ${kmdDebugLogLocation}`, 'native.confd');
      } else {
        kmdDebugLogLocation = (data.ac_name !== 'komodod' ? `${api.kmdDir}/${data.ac_name}` : api.kmdDir) + '/debug.log';
        _coindConf = data.ac_name !== 'komodod' ? `${api.kmdDir}/${data.ac_name}/${data.ac_name}.conf` : `${api.kmdDir}/komodo.conf`;
      }

      // get custom coind port
      
      try {
        const _coindConfContents = fs.readFileSync(_coindConf, 'utf8');

        if (_coindConfContents) {
          const _coindCustomPort = _coindConfContents.match(/rpcport=\s*(.*)/);

          if (_coindCustomPort[1]) {
            api.assetChainPorts[data.ac_name] = _coindCustomPort[1];
            api.rpcConf[data.ac_name === 'komodod' ? 'KMD' : data.ac_name].port = _coindCustomPort[1];
            api.log(`${data.ac_name} custom port ${_coindCustomPort[1]}`, 'native.confd');
          } else {
            api.assetChainPorts[data.ac_name] = api.assetChainPortsDefault[data.ac_name];
            api.rpcConf[data.ac_name === 'komodod' ? 'KMD' : data.ac_name].port = api.assetChainPortsDefault[data.ac_name];
            api.log(`${data.ac_name} port ${api.assetChainPorts[data.ac_name]}`, 'native.confd');
          }
        } else {
          api.assetChainPorts[data.ac_name] = api.assetChainPortsDefault[data.ac_name];
          api.rpcConf[data.ac_name === 'komodod' ? 'KMD' : data.ac_name].port = api.assetChainPortsDefault[data.ac_name];
          api.log(`${data.ac_name} port ${api.assetChainPorts[data.ac_name]}`, 'native.confd');
        }
      } catch (e) {
        if (api.rpcConf[data.ac_name === 'komodod' ? 'KMD' : data.ac_name]) {
          api.rpcConf[data.ac_name === 'komodod' ? 'KMD' : data.ac_name].port = api.assetChainPortsDefault[data.ac_name];
        }

        if (data.ac_init_rpc_port) {
          api.assetChainPorts[data.ac_name] = data.ac_init_rpc_port;
        } else {
          api.assetChainPorts[data.ac_name] = api.assetChainPortsDefault[data.ac_name];
        }

        api.log(`${data.ac_name} port ${api.assetChainPorts[data.ac_name]}`, 'native.confd');
      }

      api.log('komodod flock selected...', 'native.confd');
      api.log(`selected data: ${JSON.stringify(data, null, '\t')}`, 'native.confd');
      api.writeLog('komodod flock selected...', 'native.confd');
      api.writeLog(`selected data: ${data}`, 'native.confd');

      // datadir case, check if komodo/chain folder exists
      if (api.appConfig.general.native.dataDir.length &&
          data.ac_name !== 'komodod') {
        const _dir = data.ac_name !== 'komodod' ? `${api.kmdDir}/${data.ac_name}` : api.kmdDir;

        try {
          _fs.accessSync(_dir, fs.R_OK | fs.W_OK);

          api.log(`komodod datadir ${_dir} exists`, 'native.confd');
        } catch (e) {
          api.log(`komodod datadir ${_dir} access err: ${e}`, 'native.confd');
          api.log(`attempting to create komodod datadir ${_dir}`, 'native.confd');

          fs.mkdirSync(_dir);

          if (fs.existsSync(_dir)) {
            api.log(`created komodod datadir folder at ${_dir}`, 'native.confd');
          } else {
            api.log(`unable to create komodod datadir folder at ${_dir}`, 'native.confd');
          }
        }
      }

      // truncate debug.log
      if (!api.kmdMainPassiveMode) {
        try {
          const _confFileAccess = _fs.accessSync(
            kmdDebugLogLocation,
            fs.R_OK | fs.W_OK
          );

          if (_confFileAccess) {
            api.log(`error accessing ${kmdDebugLogLocation}`, 'native.debug');
            api.writeLog(`error accessing ${kmdDebugLogLocation}`, 'native.debug');
          } else {
            try {
              fs.unlinkSync(kmdDebugLogLocation);
              api.log(`truncate ${kmdDebugLogLocation}`, 'native.debug');
              api.writeLog(`truncate ${kmdDebugLogLocation}`);
            } catch (e) {
              api.log('cant unlink debug.log', 'native.debug');
            }
          }
        } catch (e) {
          api.log(`komodod debug.log access err: ${e}`, 'native.debug');
          api.writeLog(`komodod debug.log access err: ${e}`, 'native.debug');
        }
      }

      // get komodod instance port
      const _port = api.assetChainPorts[data.ac_name];

      try {
        // check if komodod instance is already running
        portscanner.checkPortStatus(_port, '127.0.0.1', (error, status) => {
          // Status is 'open' if currently in use or 'closed' if available
          if (status === 'closed' ||
              !api.appConfig.general.native.stopNativeDaemonsOnQuit) {
            // start komodod via exec

            const isChain = data.ac_name !== 'komodod' && data.ac_name !== 'chipsd';
            const coindACParam = isChain ? ` -ac_name=${data.ac_name} ` : '';

            if (acDaemon) {
              api.log(`exec ${api[flock + 'Bin']} ${coindACParam} ${data.ac_options.join(' ')}`, 'native.process');
              api.writeLog(`exec ${api[flock + 'Bin']} ${coindACParam} ${data.ac_options.join(' ')}`);
            } else {
              api.log(`exec ${api.komododBin} ${coindACParam} ${data.ac_options.join(' ')}`, 'native.process');
              api.writeLog(`exec ${api.komododBin} ${coindACParam} ${data.ac_options.join(' ')}`);
            }
            
            api.coindInstanceRegistry[data.ac_name] = true;
            if (!api.kmdMainPassiveMode) {
              let _arg = `${coindACParam}${data.ac_options.join(' ')}`;
              _arg = _arg.trim().split(' ');
              api.native.startParams[data.ac_name] = _arg;
              
              const _daemonName = data.ac_name !== 'komodod' ? data.ac_name : 'komodod';
              const _daemonLogName = `${api.agamaDir}/${_daemonName}.log`;

              try {
                fs.accessSync(_daemonLogName, fs.R_OK | fs.W_OK);
                api.log(`created ${_daemonLogName}`, 'native.debug');
                fs.unlinkSync(_daemonLogName);
              } catch (e) {
                api.log(`error accessing ${_daemonLogName}, doesnt exist or another proc is already running`, 'native.process');
              }

              if (!api.appConfig.general.native.stopNativeDaemonsOnQuit) {
                let spawnOut = fs.openSync(_daemonLogName, 'a');
                let spawnErr = fs.openSync(_daemonLogName, 'a');

                if (acDaemon) {
                  spawn(api[flock + 'Bin'], _arg, {
                    stdio: [
                      'ignore',
                      spawnOut,
                      spawnErr
                    ],
                    detached: true,
                  }).unref();
                } 
                else {
                  spawn(api.komododBin, _arg, {
                    stdio: [
                      'ignore',
                      spawnOut,
                      spawnErr
                    ],
                    detached: true,
                  }).unref();
                }

              } else {
                let logStream = fs.createWriteStream(
                  _daemonLogName,
                  { flags: 'a' }
                );

                let _daemonChildProc;

                if (acDaemon) {
                  _daemonChildProc = execFile(`${api[flock + 'Bin']}`, _arg, {
                    maxBuffer: 1024 * 1000000, // 1000 mb
                  }, (error, stdout, stderr) => {
                    api.writeLog(`stdout: ${stdout}`, 'native.debug');
                    api.writeLog(`stderr: ${stderr}`, 'native.debug');
  
                    if (error !== null) {
                      api.log(`exec error: ${error}`, 'native.debug');
                      api.writeLog(`exec error: ${error}`, 'native.debug');
  
                      // TODO: check other edge cases
                      if (error.toString().indexOf('using -reindex') > -1) {
                        api.io.emit('service', {
                          komodod: {
                            error: 'run -reindex',
                          },
                        });
                      }
                    }
                  });
                } else {
                  _daemonChildProc = execFile(`${api.komododBin}`, _arg, {
                    maxBuffer: 1024 * 1000000, // 1000 mb
                  }, (error, stdout, stderr) => {
                    api.writeLog(`stdout: ${stdout}`, 'native.debug');
                    api.writeLog(`stderr: ${stderr}`, 'native.debug');
  
                    if (error !== null) {
                      api.log(`exec error: ${error}`, 'native.debug');
                      api.writeLog(`exec error: ${error}`, 'native.debug');
  
                      // TODO: check other edge cases
                      if (error.toString().indexOf('using -reindex') > -1) {
                        api.io.emit('service', {
                          komodod: {
                            error: 'run -reindex',
                          },
                        });
                      }
                    }
                  });
                }
                
                // TODO: logger add verbose native output
                _daemonChildProc.stdout.on('data', (data) => {
                  // api.log(`${_daemonName} stdout: \n${data}`);
                })
                .pipe(logStream);

                _daemonChildProc.stdout.on('error', (data) => {
                  // api.log(`${_daemonName} stdout: \n${data}`);
                })
                .pipe(logStream);

                _daemonChildProc.stderr.on('data', (data) => {
                  // api.error(`${_daemonName} stderr:\n${data}`);
                })
                .pipe(logStream);

                _daemonChildProc.on('exit', (exitCode) => {
                  const _errMsg = exitCode === 0 ? `${_daemonName} exited with code ${exitCode}` : `${_daemonName} exited with code ${exitCode}, crashed?`;

                  fs.appendFile(_daemonLogName, _errMsg, (err) => {
                    if (err) {
                      api.writeLog(_errMsg);
                      api.log(_errMsg, 'native.debug');
                    }
                    api.log(_errMsg, 'native.debug');
                  });
                });
              }
            }
          } else { // deprecated(?)
            if (api.kmdMainPassiveMode) {
              api.coindInstanceRegistry[data.ac_name] = true;
            }
            api.log(`port ${_port} (${data.ac_name}) is already in use`, 'native.process');
            api.writeLog(`port ${_port} (${data.ac_name}) is already in use`);
          }
        });
      } catch(e) {
        api.log(`failed to start komodod err: ${e}`, 'native.process');
        api.writeLog(`failed to start komodod err: ${e}`);
      }
    } else if (flock === 'chipsd') {
      //TODO: Refactor chips code and handling, until then, do not touch

      let kmdDebugLogLocation = `${api.chipsDir}/debug.log`;

      api.log('chipsd flock selected...', 'native.confd');
      api.log(`selected data: ${JSON.stringify(data, null, '\t')}`, 'native.confd');
      api.writeLog('chipsd flock selected...', 'native.confd');
      api.writeLog(`selected data: ${data}`, 'native.confd');

      // truncate debug.log
      try {
        const _confFileAccess = _fs.accessSync(
          kmdDebugLogLocation,
          fs.R_OK | fs.W_OK
        );

        if (_confFileAccess) {
          api.log(`error accessing ${kmdDebugLogLocation}`, 'native.debug');
          api.writeLog(`error accessing ${kmdDebugLogLocation}`);
        } else {
          try {
            fs.unlinkSync(kmdDebugLogLocation);
            api.log(`truncate ${kmdDebugLogLocation}`, 'native.debug');
            api.writeLog(`truncate ${kmdDebugLogLocation}`);
          } catch (e) {
            api.log('cant unlink debug.log', 'native.debug');
          }
        }
      } catch(e) {
        api.log(`chipsd debug.log access err: ${e}`, 'native.debug');
        api.writeLog(`chipsd debug.log access err: ${e}`);
      }

      // get komodod instance port
      const _port = api.assetChainPorts.chipsd;

      try {
        // check if komodod instance is already running
        portscanner.checkPortStatus(_port, '127.0.0.1', (error, status) => {
          // Status is 'open' if currently in use or 'closed' if available
          if (status === 'closed') {
            // start komodod via exec

            api.log(`exec ${api.chipsBin}`, 'native.process');
            api.writeLog(`exec ${api.chipsBin}`);

            api.coindInstanceRegistry.CHIPS = true;
            execFile(`${api.chipsBin}`, {
              maxBuffer: 1024 * 1000000 // 1000 mb
            }, (error, stdout, stderr) => {
              api.writeLog(`stdout: ${stdout}`);
              api.writeLog(`stderr: ${stderr}`);

              if (error !== null) {
                api.log(`exec error: ${error}`, 'native.process');
                api.writeLog(`exec error: ${error}`);

                if (error.toString().indexOf('using -reindex') > -1) {
                  api.io.emit('service', {
                    komodod: {
                      error: 'run -reindex',
                    },
                  });
                }
              }
            });
          }
        });
      } catch(e) {
        api.log(`failed to start chipsd err: ${e}`, 'native.process');
        api.writeLog(`failed to start chipsd err: ${e}`);
      }
    }

    if (flock === 'zcashd') { // TODO: fix(?)
      let kmdDebugLogLocation = `${api.zecDir}/debug.log`;

      api.log('zcashd flock selected...', 'native.confd');
      api.log(`selected data: ${data}`, 'native.confd');
      api.writeLog('zcashd flock selected...', 'native.confd');
      api.writeLog(`selected data: ${data}`, 'native.confd');
    }

    if (flock === 'coind') {
      const _osHome = os.platform === 'win32' ? process.env.APPDATA : process.env.HOME;
      let coindDebugLogLocation = `${_osHome}/.${api.nativeCoindList[coind.toLowerCase()].bin.toLowerCase()}/debug.log`;

      api.log(`coind ${coind} flock selected...`, 'native.confd');
      api.log(`selected data: ${JSON.stringify(data, null, '\t')}`, 'native.confd');
      api.writeLog(`coind ${coind} flock selected...`, 'native.confd');
      api.writeLog(`selected data: ${data}`, 'native.confd');

      // truncate debug.log
      try {
        _fs.access(coindDebugLogLocation, fs.constants.R_OK, (err) => {
          if (err) {
            api.log(`error accessing ${coindDebugLogLocation}`, 'native.debug');
            api.writeLog(`error accessing ${coindDebugLogLocation}`);
          } else {
            api.log(`truncate ${coindDebugLogLocation}`, 'native.debug');
            api.writeLog(`truncate ${coindDebugLogLocation}`);
            fs.unlink(coindDebugLogLocation);
          }
        });
      } catch (e) {
        api.log(`coind ${coind} debug.log access err: ${e}`, 'native.debug');
        api.writeLog(`coind ${coind} debug.log access err: ${e}`);
      }

      // get komodod instance port
      const _port = api.nativeCoindList[coind.toLowerCase()].port;
      const coindBin = acDaemon ? 
        `${api[flock + 'Bin']}/${coind.toLowerCase()}/${api.nativeCoindList[coind.toLowerCase()].bin.toLowerCase()}d`
        :
        `${api.coindRootDir}/${coind.toLowerCase()}/${api.nativeCoindList[coind.toLowerCase()].bin.toLowerCase()}d`;

      try {
        // check if coind instance is already running
        portscanner.checkPortStatus(_port, '127.0.0.1', (error, status) => {
          // Status is 'open' if currently in use or 'closed' if available
          if (status === 'closed') {
            api.log(`exec ${coindBin} ${data.ac_options.join(' ')}`, 'native.process');
            api.writeLog(`exec ${coindBin} ${data.ac_options.join(' ')}`);

            api.coindInstanceRegistry[coind] = true;
            let _arg = `${data.ac_options.join(' ')}`;
            _arg = _arg.trim().split(' ');
            execFile(`${coindBin}`, _arg, {
              maxBuffer: 1024 * 1000000, // 1000 mb
            }, (error, stdout, stderr) => {
              api.writeLog(`stdout: ${stdout}`);
              api.writeLog(`stderr: ${stderr}`);

              if (error !== null) {
                api.log(`exec error: ${error}`, 'native.process');
                api.writeLog(`exec error: ${error}`);
              }
            });
          } else {
            api.log(`port ${_port} (${coind}) is already in use`, 'native.process');
            api.writeLog(`port ${_port} (${coind}) is already in use`);
          }
        });
      } catch (e) {
        api.log(`failed to start ${coind} err: ${e}`, 'native.process');
        api.writeLog(`failed to start ${coind} err: ${e}`);
      }
    }
  }

  const setConf = (flock, coind) => {
    const _platform = os.platform();
    let nativeCoindDir;
    let DaemonConfPath;

    api.log(flock, 'native.confd');
    api.writeLog(`setconf ${flock}`);

    switch (_platform) {
      case 'darwin':
        nativeCoindDir = coind ? `${process.env.HOME}/Library/Application Support/${api.nativeCoindList[coind.toLowerCase()].bin}` : null;
        break;
      case 'linux':
        nativeCoindDir = coind ? `${process.env.HOME}/.${api.nativeCoindList[coind.toLowerCase()].bin.toLowerCase()}` : null;
        break;
      case 'win32':
        nativeCoindDir = coind ?  `${process.env.APPDATA}/${api.nativeCoindList[coind.toLowerCase()].bin}` : null;
        break;
    }

    switch (flock) {
      case 'verusd':
        if (coind && api.appConfig.general.main.reservedChains.indexOf(coind) === -1) {
          DaemonConfPath = `${api.verusDir}/PBAAS/${coind}.conf`;
        } else {
          DaemonConfPath = `${api.vrscDir}/VRSC.conf`;
        }
        

        if (_platform === 'win32') {
          DaemonConfPath = path.normalize(DaemonConfPath);
        }
        break;
      case 'komodod':
        DaemonConfPath = `${api.kmdDir}/komodo.conf`;

        if (_platform === 'win32') {
          DaemonConfPath = path.normalize(DaemonConfPath);
        }
        break;
      case 'zcashd':
        DaemonConfPath = `${api.ZcashDir}/zcash.conf`;

        if (_platform === 'win32') {
          DaemonConfPath = path.normalize(DaemonConfPath);
        }
        break;
      case 'chipsd':
        DaemonConfPath = `${api.chipsDir}/chips.conf`;

        if (_platform === 'win32') {
          DaemonConfPath = path.normalize(DaemonConfPath);
        }
        break;
      case 'coind':
        DaemonConfPath = `${nativeCoindDir}/${api.nativeCoindList[coind.toLowerCase()].bin.toLowerCase()}.conf`;

        if (_platform === 'win32') {
          DaemonConfPath = path.normalize(DaemonConfPath);
        }
        break;
      default:
        DaemonConfPath = `${api.kmdDir}/${flock}/${flock}.conf`;

        if (_platform === 'win32') {
          DaemonConfPath = path.normalize(DaemonConfPath);
        }
    }

    api.log(DaemonConfPath, 'native.confd');
    api.writeLog(`setconf ${DaemonConfPath}`);

    const CheckFileExists = () => {
      return new Promise((resolve, reject) => {
        const result = 'Check Conf file exists is done';
        const confFileExist = fs.ensureFileSync(DaemonConfPath);

        if (confFileExist) {
          api.log(result, 'native.confd');
          api.writeLog(`setconf ${result}`);

          resolve(result);
        } else {
          api.log('conf file doesnt exist', 'native.confd');
          resolve('conf file doesnt exist');
        }
      });
    }

    const FixFilePermissions = () => {
      return new Promise((resolve, reject) => {
        const result = 'Conf file permissions updated to Read/Write';

        fsnode.chmodSync(DaemonConfPath, '0666');
        api.log(result, 'native.confd');
        api.writeLog(`setconf ${result}`);

        resolve(result);
      });
    }

    const RemoveLines = () => {
      return new Promise((resolve, reject) => {
        const result = 'RemoveLines is done';

        fs.readFile(DaemonConfPath, 'utf8', (err, data) => {
          if (err) {
            api.writeLog(`setconf error ${err}`);
            return api.log(err);
          }

          const rmlines = data.replace(/(?:(?:\r\n|\r|\n)\s*){2}/gm, '\n');

          fs.writeFile(DaemonConfPath, rmlines, 'utf8', (err) => {
            if (err)
              return api.log(err);

            fsnode.chmodSync(DaemonConfPath, '0666');
            api.writeLog(`setconf ${result}`, 'native.confd');
            api.log(result);
            resolve(result);
          });
        });
      });
    }

    const CheckConf = () => {
      return new Promise((resolve, reject) => {
        const result = 'CheckConf is done';

        api.setconf.status(DaemonConfPath, (err, status) => {
          const rpcuser = () => {
            return new Promise((resolve, reject) => {
              const result = 'checking rpcuser...';

              if (status[0].hasOwnProperty('rpcuser')) {
                api.log('rpcuser: OK', 'native.confd');
                api.writeLog('rpcuser: OK');
              } else {
                const randomstring = md5((Math.random() * Math.random() * 999).toString());

                api.log('rpcuser: NOT FOUND', 'native.confd');
                api.writeLog('rpcuser: NOT FOUND');

                fs.appendFile(DaemonConfPath, `\nrpcuser=user${randomstring.substring(0, 16)}`, (err) => {
                  if (err) {
                    api.writeLog(`append daemon conf err: ${err}`);
                    api.log(`append daemon conf err: ${err}`, 'native.confd');
                  }
                  // throw err;
                  api.log('rpcuser: ADDED', 'native.confd');
                  api.writeLog('rpcuser: ADDED');
                });
              }

              resolve(result);
            });
          }

          const rpcpass = () => {
            return new Promise((resolve, reject) => {
              const result = 'checking rpcpassword...';

              if (status[0].hasOwnProperty('rpcpassword')) {
                api.log('rpcpassword: OK', 'native.confd');
                api.writeLog('rpcpassword: OK');
              } else {
                const randomstring = md5((Math.random() * Math.random() * 999).toString());

                api.log('rpcpassword: NOT FOUND');
                api.writeLog('rpcpassword: NOT FOUND');

                fs.appendFile(DaemonConfPath, `\nrpcpassword=${randomstring}`, (err) => {
                  if (err) {
                    api.writeLog(`append daemon conf err: ${err}`);
                    api.log(`append daemon conf err: ${err}`, 'native.confd');
                  }
                  api.log('rpcpassword: ADDED', 'native.confd');
                  api.writeLog('rpcpassword: ADDED');
                });
              }

              resolve(result);
            });
          }

          const rpcport = () => {
            return new Promise((resolve, reject) => {
              const result = 'checking rpcport...';

              if (flock === 'komodod') {
                if (status[0].hasOwnProperty('rpcport')) {
                  api.log('rpcport: OK', 'native.confd');
                  api.writeLog('rpcport: OK');
                } else {
                  api.log('rpcport: NOT FOUND', 'native.confd');
                  api.writeLog('rpcport: NOT FOUND');

                  fs.appendFile(DaemonConfPath, '\nrpcport=7771', (err) => {
                    if (err) {
                      api.writeLog(`append daemon conf err: ${err}`);
                      api.log(`append daemon conf err: ${err}`, 'native.confd');
                    }
                    api.log('rpcport: ADDED', 'native.confd');
                    api.writeLog('rpcport: ADDED');
                  });
                }
              }

              resolve(result);
            });
          }

          const server = () => {
            return new Promise((resolve, reject) => {
              const result = 'checking server...';

              if (status[0].hasOwnProperty('server')) {
                api.log('server: OK', 'native.confd');
                api.writeLog('server: OK');
              } else {
                api.log('server: NOT FOUND');
                api.writeLog('server: NOT FOUND');

                fs.appendFile(DaemonConfPath, '\nserver=1', (err) => {
                  if (err) {
                    api.writeLog(`append daemon conf err: ${err}`, 'native.confd');
                    api.log(`append daemon conf err: ${err}`);
                  }
                  // throw err;
                  api.log('server: ADDED', 'native.confd');
                  api.writeLog('server: ADDED');
                });
              }

              resolve(result);
            });
          }

          const addnode = () => {
            return new Promise((resolve, reject) => {
              const result = 'checking addnode...';

              if (flock === 'chipsd' ||
                  flock === 'komodod') {
                if (status[0].hasOwnProperty('addnode')) {
                  api.log('addnode: OK', 'native.confd');
                  api.writeLog('addnode: OK');
                } else {
                  let nodesList;

                  if (flock === 'chipsd') {
                    nodesList = '\naddnode=95.110.191.193' +
                    '\naddnode=144.76.167.66' +
                    '\naddnode=158.69.248.93' +
                    '\naddnode=149.202.49.218' +
                    '\naddnode=95.213.205.222' +
                    '\naddnode=5.9.253.198' +
                    '\naddnode=164.132.224.253' +
                    '\naddnode=163.172.4.66' +
                    '\naddnode=217.182.194.216' +
                    '\naddnode=94.130.96.114' +
                    '\naddnode=5.9.253.195';
                  } else if (flock === 'komodod') {
                    nodesList = '\naddnode=78.47.196.146' +
                    '\naddnode=5.9.102.210' +
                    '\naddnode=178.63.69.164' +
                    '\naddnode=88.198.65.74' +
                    '\naddnode=5.9.122.241' +
                    '\naddnode=144.76.94.3';
                  }

                  api.log('addnode: NOT FOUND', 'native.confd');
                  fs.appendFile(DaemonConfPath, nodesList, (err) => {
                    if (err) {
                      api.writeLog(`append daemon conf err: ${err}`);
                      api.log(`append daemon conf err: ${err}`, 'native.confd');
                    }
                    api.log('addnode: ADDED', 'native.confd');
                    api.writeLog('addnode: ADDED');
                  });
                }
              } else {
                result = 'skip addnode';
              }

              resolve(result);
            });
          }

          rpcuser()
          .then((result) => {
            return rpcpass();
          })
          .then(server)
          .then(rpcport)
          .then(addnode);
        });

        api.log(result, 'native.confd');
        api.writeLog(`checkconf addnode ${result}`);

        resolve(result);
      });
    }

    CheckFileExists()
    .then((result) => {
      return FixFilePermissions();
    })
    .then(RemoveLines)
    .then(CheckConf);
  }

  /**
   * Function to activate coin daemon in native mode
   
  api.post('/herd', (req, res) => {
    if (api.checkToken(req.body.token)) {
      const { options, herd, coind } = req.body
      const { ac_name } = options
      api.log(`${ac_name} daemon activation requested`, 'native.process');

      if (options &&
          !api.kmdMainPassiveMode) {
        const testCoindPort = (skipError) => {
          if (!api.lockDownAddCoin) {
            const _port = api.assetChainPorts[ac_name];

            portscanner.checkPortStatus(_port, '127.0.0.1', (error, status) => {
              // Status is 'open' if currently in use or 'closed' if available
              if (status === 'open' &&
              api.appConfig.general.native.stopNativeDaemonsOnQuit) {
                if (!skipError) {
                  api.log(`komodod service start error at port ${_port}, reason: port is closed`, 'native.process');
                  api.writeLog(`komodod service start error at port ${_port}, reason: port is closed`);
                  api.io.emit('service', {
                    komodod: {
                      error: `error starting ${herd} ${ac_name} daemon. Port ${_port} is already taken!`,
                    },
                  });

                  const retObj =  {
                    msg: 'error',
                    result: `error starting ${herd} ${ac_name} daemon. Port ${_port} is already taken!`,
                  };

                  res.status(500);
                  res.end(JSON.stringify(retObj));
                } else {
                  api.log(`daemon service start success at port ${_port}`, 'native.process');
                  api.writeLog(`daemon service start success at port ${_port}`);
                }
              } else {
                if (!skipError) {
                  herder(herd, options);

                  const retObj = {
                    msg: 'success',
                    result: 'result',
                  };
                  
                  res.status(200);
                  res.end(JSON.stringify(retObj));
                } else {
                  api.log(`komodod service start error at port ${_port}, reason: unknown`, 'native.process');
                  api.writeLog(`komodod service start error at port ${_port}, reason: unknown`);
                }
              }
            });
          }
        }

        if (herd === 'komodod') {
          // check if komodod instance is already running
          testCoindPort();
          setTimeout(() => {
            testCoindPort(true);
          }, 10000);
        } else {
          herder(herd, options, coind);

          const retObj = {
            msg: 'success',
            result: 'result',
          };

          res.status(200);
          res.end(JSON.stringify(retObj));
        }
      } else {
        // (?)
        herder(herd, options);

        const retObj = {
          msg: 'success',
          result: 'result',
        };

        res.end(JSON.stringify(retObj));
      }
    } else {
      const retObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.status(401);
      res.end(JSON.stringify(retObj));
    }
  });

  /*
   *  type: POST
   */
  api.post('/setconf', (req, res) => {
    if (api.checkToken(req.body.token)) {
      const _body = req.body;

      api.log('setconf req.body =>', 'native.confd');
      api.log(_body, 'native.confd');

      if (os.platform() === 'win32' &&
          _body.chain == 'komodod') {
        setkomodoconf = spawn(path.join(__dirname, '../assets/bin/win64/genkmdconf.bat'));
      } else {
        api.setConf(_body.chain);
      }

      const retObj = {
        msg: 'success',
        result: 'result',
      };

      res.end(JSON.stringify(retObj));
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
   *
  api.post('/getconf', (req, res) => {
    const _body = req.body;

    if (api.checkToken(_body.token)) {
      api.log('getconf req.body =>', 'native.confd');
      api.log(_body, 'native.confd');

      const confpath = getConf(_body.chain, _body.coind);

      api.log(`getconf path is: ${confpath}`, 'native.confd');
      api.writeLog(`getconf path is: ${confpath}`, 'native.confd');

      const retObj = {
        msg: 'success',
        result: confpath,
      };

      res.end(JSON.stringify(retObj));
    } else {
      const retObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(retObj));
    }
  });

  api.setConfKMD = (isChips) => {
    // check if kmd conf exists
    _fs.access(isChips ? `${api.chipsDir}/chips.conf` : `${api.kmdDir}/komodo.conf`, fs.constants.R_OK, (err) => {
      if (err) {
        api.log(isChips ? 'creating chips conf' : 'creating komodo conf', 'native.confd');
        api.writeLog(isChips ? `creating chips conf in ${api.chipsDir}/chips.conf` : `creating komodo conf in ${api.kmdDir}/komodo.conf`);
        setConf(isChips ? 'chipsd' : 'komodod');
      } else {
        const _confSize = fs.lstatSync(isChips ? `${api.chipsDir}/chips.conf` : `${api.kmdDir}/komodo.conf`);

        if (_confSize.size === 0) {
          api.log(isChips ? 'err: chips conf file is empty, creating chips conf' : 'err: komodo conf file is empty, creating komodo conf', 'native.confd');
          api.writeLog(isChips ? `creating chips conf in ${api.chipsDir}/chips.conf` : `creating komodo conf in ${api.kmdDir}/komodo.conf`);
          setConf(isChips ? 'chipsd' : 'komodod');
        } else {
          api.writeLog(isChips ? 'chips conf exists' : 'komodo conf exists');
          api.log(isChips ? 'chips conf exists' : 'komodo conf exists', 'native.confd');
        }
      }
    });
  }

  api.getAssetChainPorts = () => {
    return api.assetChainPorts;
  }

  return api;
};*/