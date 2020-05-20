const spawn = require('child_process').spawn;
const fs = require('fs-extra');
const _fs = require('graceful-fs');
const fsnode = require('fs');
const path = require('path');
const os = require('os');
const portscanner = require('portscanner');
const execFile = require('child_process').execFile;
const Promise = require('bluebird');
const md5 = require('agama-wallet-lib/src/crypto/md5');
const { generateRpcPassword } = require('./utils/auth/rpcAuth.js');

module.exports = (api) => {
  api.isPbaasDaemon = (daemon, coin) => {
    return daemon === 'verusd' && api.appConfig.general.main.reservedChains.indexOf(coin) === -1
  }
  
  api.processChainArgs = (coin, paramArray) => {
    const paramString = paramArray.join(' ')
    api.native.startParams[coin] = paramString;
    return api.native.startParams[coin];
  }

  api.initLogfile = (coin) => {
    return new Promise((resolve, reject) => {
      const logName = `${api.agamaDir}/${coin}.log`;

      api.log(`initializing ${coin} log file for verus-desktop`, 'native.process');
      fs.access(logName, fs.R_OK | fs.W_OK)
        .then(() => {
          api.log(`located ${logName}`, "native.debug");
          api.logFileIndex[coin] = logName
          resolve()
        })
        .catch(e => {
          if (e.code !== 'ENOENT') throw e

          api.log(
            `${logName} doesnt exist, creating new logfile...`,
            "native.process"
          );

          return fs.writeFile(logName, '').then(() => {
            api.log(
              `${logName} created, saving to log file index...`,
              "native.process"
            );
            api.logFileIndex[coin] = logName
  
            resolve()
          })
          .catch(e => reject(e))
        })
        .catch(e => {
          api.log(
            `error accessing ${logName}, doesnt exist or another proc is already running`,
            "native.process"
          );
          reject(e);
        })
    })
  }

  api.writeRpcUser = (confFile) => {
    return new Promise((resolve, reject) => {
      api.log(`creating rpcuser for ${confFile}...`, "native.process");
      fs.appendFile(confFile, '\nrpcuser=verusdesktop')
      .then(resolve)
      .catch(e => reject(e))
    })
  }

  api.writeRpcPassword = (confFile) => {
    return new Promise((resolve, reject) => {
      api.log(`creating rpcpassword for ${confFile}...`, "native.process");
      fs.appendFile(confFile, `\nrpcpassword=${generateRpcPassword()}`)
      .then(resolve)
      .catch(e => reject(e))
    })
  }

  api.writeRpcPort = (coin, confFile, fallbackPort) => {
    return new Promise((resolve, reject) => {
      api.log(`creating rpcport for ${confFile}...`, "native.process");

      const appendPort = () => {
        if (api.assetChainPortsDefault[coin]) {
          api.log(`${coin} default port found...`, "native.process");
          return fs.appendFile(confFile, `\nrpcport=${api.assetChainPortsDefault[coin]}`)
        } else if (fallbackPort != null) {
          api.log(`no ${coin} default port found, using fallback...`, "native.process");
          return fs.appendFile(confFile, `\nrpcport=${fallbackPort}`)
        } else {
          api.log(`no ${coin} default port or fallback port found, finding available port...`, "native.process");
  
          return new Promise((resolve, reject) => {
            portscanner.findAPortNotInUse(3000, 3010, '127.0.0.1')
            .then(port => {
              api.log(`available port found at ${port}...`, "native.process");
              return fs.appendFile(confFile, `\nrpcport=${port}`)
            })
            .then(resolve)
            .catch(e => reject(e))
          }) 
        }
      }

      appendPort()
      .then(() => {
        api.log(`set port for ${coin} in conf...`, "native.process");
        resolve()
      })
      .catch(e => reject(e))
    })
  }

  api.WriteAddNode = (address, confFile, port) => {
    return new Promise((resolve, reject) => {
      api.log(`creating rpcpassword for ${confFile}...`, "native.process");
      fs.appendFile(confFile, `\naddnode=${address}:${port}`)
          .then(resolve)
          .catch(e => reject(e))
    })
  }

  api.initConffile = (coin, confName, fallbackPort) => {
    const coinLc = coin.toLowerCase()
    return new Promise((resolve, reject) => {
      const confFile = `${api[`${coinLc}Dir`]}/${confName == null ? coin : confName}.conf`;

      api.log(`initializing ${coinLc} conf file for verus-desktop`, 'native.process');
      fs.access(confFile, fs.R_OK | fs.W_OK)
        .then(() => {
          api.log(`located ${confFile}`, "native.debug");
          api.confFileIndex[coin] = confFile
          return fs.readFile(confFile, "utf8")
        })
        .then(confHandle => {
          const port = confHandle.match(/rpcport=\s*(.*)/);
          const user = confHandle.match(/rpcuser=\s*(.*)/);
          const password = confHandle.match(/rpcpassword=\s*(.*)/);
          const handleMatches = [
            {
              name: "rpcport",
              match: port,
              writePromise: () => api.writeRpcPort(coin, confFile, fallbackPort),
            },
            {
              name: "rpcuser",
              match: user,
              writePromise: () => api.writeRpcUser(confFile)
            },
            {
              name: "rpcpassword",
              match: password,
              writePromise: () => api.writeRpcPassword(confFile)
            }
          ];
          let configPromises = []

          handleMatches.map(matchObj => {
            if (matchObj.match === null) {
              api.log(
                `${matchObj.name} not found in ${coinLc} conf file, going to append manually...`,
                "native.process"
              );

              configPromises.push(matchObj.writePromise)
            }
          })

          return Promise.all(configPromises)
        })
        .then(resolve)
        .catch(e => {
          if (e.code !== 'ENOENT') throw e

          api.log(
            `${confFile} doesnt exist, creating new conf file...`,
            "native.process"
          );

          return fs
            .writeFile(confFile, "")
            .then(() => {
              api.log(
                `${confFile} created, saving to conf file index...`,
                "native.process"
              );
              api.confFileIndex[coin] = confFile;
              if (coin === 'VRSCTEST') {
                return Promise.all([
                  api.writeRpcPort(coin, confFile, fallbackPort),
                  api.writeRpcPassword(confFile),
                  api.writeRpcUser(confFile),
                  api.WriteAddNode('185.25.48.72', confFile, '16329'),
                  api.WriteAddNode('185.64.105.111', confFile, '16329')
                ]);
              } else {
                return Promise.all([
                  api.writeRpcPort(coin, confFile, fallbackPort),
                  api.writeRpcPassword(confFile),
                  api.writeRpcUser(confFile)
                ]);
              }
            })
            .then(resolve)
            .catch(e => reject(e));
        })
        .catch(e => {
          api.log(
            `error accessing ${confFile}, doesnt exist or another proc is already running`,
            "native.process"
          );
          reject(e);
        })
    })
  }

  api.initCoinDir = (coinLc) => {
    return new Promise((resolve, reject) => {
      const coinDir = api[`${coinLc}Dir`];

      api.log(`initializing ${coinLc} directory file for verus-desktop`, 'native.process');
      fs.access(coinDir, fs.R_OK | fs.W_OK)
        .then(() => {
          api.log(`located ${coinDir}`, "native.debug");
          resolve()
        })
        .catch(e => {
          if (e.code !== 'ENOENT') throw e

          api.log(
            `${coinDir} doesnt exist, creating new coin directory...`,
            "native.process"
          );

          return fs.mkdir(coinDir).then(() => {
            api.log(
              `${coinDir} created...`,
              "native.process"
            );
  
            resolve()
          })
          .catch(e => reject(e))
        })
        .catch(e => {
          api.log(
            `error accessing ${coinDir}, doesnt exist or another proc is already running`,
            "native.process"
          );
          reject(e);
        })
    })
  }

  api.prepareCoinPort = (coin, confName, fallbackPort) => {
    const coinLc = coin.toLowerCase()
    const confLocation = `${api[`${coinLc}Dir`]}/${
      confName ? confName : coin
    }.conf`;
    api.log(`attempting to read ${confLocation}...`, "native.process");

    if (api.assetChainPorts[coin] != null) {
      return new Promise(resolve => {
        api.log(
          `${coin} port in memory...`,
          "native.confd"
        );
        resolve();
      });
    } else {
      return new Promise((resolve, reject) => {
        fs.readFile(confLocation, "utf8")
          .then(confFile => {
            const customPort = confFile.match(/rpcport=\s*(.*)/);

            if (customPort[1]) {
              api.assetChainPorts[coin] = customPort[1];
              api.rpcConf[coin].port = customPort[1];
              api.log(
                `${coin} port read from conf file and set to ${customPort[1]}...`,
                "native.confd"
              );
              resolve();
            } else {
              api.assetChainPorts[coin] = api.assetChainPortsDefault[coin];
              api.rpcConf[coin].port = api.assetChainPortsDefault[coin];
              api.log(
                `${coin} port not found in conf file, using default port ${customPort[1]}...`,
                "native.confd"
              );
              resolve();
            }
          })
          .catch(e => {
            api.log(
              `failed to read ${coin} port from conf file, and/or it wasnt found in the default ports list!`,
              "native.process"
            );

            if (api.rpcConf[coin])
              api.rpcConf[coin].port = api.assetChainPortsDefault[coin];

            if (fallbackPort) {
              api.log(
                `fallback port detected, using ${fallbackPort}...`,
                "native.process"
              );
              api.assetChainPorts[coin] = fallbackPort;
              resolve();
            } else if (api.assetChainPortsDefault[coin] != null) {
              api.log(
                `no fallback port detected, using ${api.assetChainPortsDefault[coin]}...`,
                "native.process"
              );
              api.assetChainPorts[coin] = api.assetChainPortsDefault[coin];
              resolve();
            } else {
              api.log(
                `no fallback or default port detected! throwing error...`,
                "native.process"
              );
              reject(e);
            }
          });
      });
    }
  };

  api.checkPort = port => {
    return new Promise((resolve, reject) => {
      portscanner
        .checkPortStatus(port, "127.0.0.1")
        .then(status => {
          // Status is 'open' if currently in use or 'closed' if available
          const portStatus = status === 'closed' ? 'AVAILABLE' : 'UNAVAILABLE'
          api.log(`port check on port ${port} returned: ${portStatus}`, 'native.checkPort');
          api.writeLog(`port check on port ${port} returned: ${portStatus}`);

          resolve(status === 'closed' ? 'AVAILABLE' : 'UNAVAILABLE')
        })
        .catch(err => reject(err));
    });
  };

  // Spawn dameon child process
  api.spawnDaemonChild = (daemon, coin, acOptions) => {
    try {
      const daemonChild = execFile(`${api[daemon + 'Bin']}`, acOptions, {
        maxBuffer: 1024 * 1000000, // 1000 mb
      }, (error, stdout, stderr) => {
        api.writeLog(`stdout: ${stdout}`, 'native.debug');
        api.writeLog(`stderr: ${stderr}`, 'native.debug');
  
        if (error !== null) {
          api.log(`exec error: ${error}`, 'native.debug');
          api.writeLog(`exec error: ${error}`, 'native.debug');
        }
      });
  
      daemonChild.on('exit', (exitCode) => {
        const errMsg = `${daemon} exited with code ${exitCode}${exitCode === 0 ? '' : ', crashed?'}`;
  
        fs.appendFile(`${api.agamaDir}/${coin}.log`, errMsg, (err) => {
          if (err) {
            api.writeLog(errMsg);
            api.log(errMsg, 'native.debug');
          }
          api.log(errMsg, 'native.debug');
        });
      });

      daemonChild.on('error', (err) => {
        const errMsg = `${daemon} error: ${err.message}`;
  
        fs.appendFile(`${api.agamaDir}/${coin}.log`, errMsg, (err) => {
          if (err) {
            api.writeLog(errMsg);
            api.log(errMsg, 'native.debug');
          }
          api.log(errMsg, 'native.debug');
        });
      });

      api.log(`summoning ritual complete, ${daemon} daemon child spawned successfully for ${coin}.`, 'native.process');
    } catch (e) {
      api.log(`error spawning ${daemon} for ${coin} with ${acOptions}:`, 'native.process');
      api.log(e.message, 'native.process');
      throw e
    }
  }

  /**
   * Start a coin daemon provided that start params, the daemon name, the api token, 
   * and optionally, the custom name of the coin data directory
   * @param {String} coin The chain ticker for the daemon to start
   * @param {String[]} acOptions Options to start the coin daemon with
   * @param {String} deamon The name of the coin daemon binary
   * @param {Object} dirNames An object containing the names of the coin data
   * directory, from the home directory of the system, on each different OS { darwin, linux, win32 }
   * @param {Number} fallbackPort (optional) The port that will be used if none if found for the coin
   */
  api.startDaemon = (coin, acOptions, daemon = 'verusd', dirNames, confName, fallbackPort) => {
    const coinLc = coin.toLowerCase()
    let port = null;

    api.log(`${coin} daemon activation requested with ${daemon} binary...`, 'native.process');
    api.log(`selected data: ${JSON.stringify(acOptions, null, '\t')}`, 'native.confd');

    return new Promise((resolve, reject) => {
      // Set coin daemon bin location into memory if it doesn't exist there yet
      if (api[`${daemon}Bin`] == null) {
        api.log(`${daemon} binaries not used yet this session, saving their path...`, 'native.process');
        api.setDaemonPath(daemon)
        api.log(`${daemon} binary path set to ${api[`${daemon}Bin`]}`, 'native.process');
      }

      // Set coin data directory into memory if it doesnt exist yet
      if (api[`${coinLc}Dir`] == null) {
        api.log(`${coin} data directory not already saved in memory...`, 'native.process');

        if (dirNames != null) {
          api.log(`saving ${coin} data directory as custom specified dir...`, 'native.process');
        } else {
          reject(new Error(`Could not start ${coin} daemon, no data directory found or specified!`))
        }

        api.setCoinDir(coinLc, dirNames)
        api.log(`${coin} dir path set to ${api[`${coinLc}Dir`]}...`, 'native.process');
      } else api.log(`${coin} data directory retrieved...`, 'native.process');

      api.initCoinDir(coinLc)
      .then(() => {
        return Promise.all([api.initLogfile(coin), api.initConffile(coin, confName, fallbackPort)])
      })
      .then(() => {
        return api.prepareCoinPort(coin, confName, fallbackPort)
      })
      .then(() => {
        port = api.assetChainPorts[coin]
        return api.checkPort(port)
      })
      .then(status => {
        if (status === 'AVAILABLE') {
          api.log(`port ${port} available, starting daemon...`, 'native.process');
          api.coindInstanceRegistry[coin] = true;

          api.spawnDaemonChild(daemon, coin, acOptions)
          resolve()
        } else {
          api.log(`port ${port} not available, assuming coin has already been started...`, 'native.process');
          api.coindInstanceRegistry[coin] = true;

          resolve()
        }
      })
      .catch(err => reject(err))
    })
  }

  api.getAssetChainPorts = () => {
    return api.assetChainPorts;
  }

  return api;
};