const request = require('request');

module.exports = (api) => {
  api.native.activateNativeCoin = (
    coin,
    startupParams = [],
    daemon,
    fallbackPort,
    dirNames,
    confName
  ) => {
    let acOptions = []
    const chainParams = api.chainParams[coin];

    for (let key in chainParams) {
      if (typeof chainParams[key] === "object") {
        for (let i = 0; i < chainParams[key].length; i++) {
          acOptions.push(`-${key}=${chainParams[key][i]}`);
        }
      } else {
        acOptions.push(`-${key}=${chainParams[key]}`);
      }
    }

    acOptions = acOptions.concat(startupParams);

    return new Promise((resolve, reject) => {
      api
        .startDaemon(coin, acOptions, daemon, dirNames, confName, fallbackPort)
        .then(() => {
          // Set timeout for "No running daemon message" to be
          // "Initializing daemon" for a few seconds
          api.coinsInitializing.push(coin);

          setTimeout(() => {
            api.coinsInitializing.splice(
              api.coinsInitializing.indexOf(coin),
              1
            );
          }, 20000);

          api.log(
            `${coin} daemon activation started successfully, waiting on daemon response...`,
            "native.confd"
          );

          resolve()
        })
        .catch(err => {
          api.log(`${coin} failed to activate, error:`, "native.confd");
          api.log(err.message, "native.confd");

          reject(err)
        });
    });
  };

  /**
   * Function to activate coin daemon in native mode
   */
  api.post('/native/coins/activate', (req, res) => {
    if (api.checkToken(req.body.token)) {
      const { chainTicker, launchConfig } = req.body
      let { startupParams, daemon, fallbackPort, dirNames, confName } = launchConfig

      // Push in startupOptions according to config file
      if (
        api.appConfig.coin.native.dataDir[chainTicker] &&
        api.appConfig.coin.native.dataDir[chainTicker].length > 0
      ) {
        startupParams.push(`-datadir=${api.appConfig.coin.native.dataDir[chainTicker]}`)
      }

      if (
        api.appConfig.coin.native.stakeGuard[chainTicker] &&
        api.appConfig.coin.native.stakeGuard[chainTicker].length > 0
      ) {
        startupParams.push(`-cheatcatcher=${api.appConfig.coin.native.stakeGuard[chainTicker]}`)
      }

      api.native
        .activateNativeCoin(
          chainTicker,
          startupParams,
          daemon,
          fallbackPort,
          dirNames,
          confName
        )
        .then(result => {
          const retObj = {
            msg: "success",
            result
          };

          res.end(JSON.stringify(retObj));
        })
        .catch(e => {
          const retObj = {
            msg: "error",
            result: e.message
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

  return api;
};