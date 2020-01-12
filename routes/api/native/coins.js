const request = require('request');

module.exports = (api) => {
  api.native.activateNativeCoin = (coin, startupParams = [], overrideDaemon = null, overrideRpcPort = null) => {
    let herdData = {
      ac_name: coin === 'KMD' ? 'komodod' : coin,
      ac_options: [
        '-daemon=0',
        '-server',
      ],
      ac_daemon: overrideDaemon,
      ac_init_rpc_port: overrideRpcPort
    };
    const port = api.assetChainPorts[coin]
    const chainParams = api.chainParams[coin]
  
    for (let key in chainParams) {
      if (key === 'ac_daemon' && overrideDaemon == null) {
        herdData.ac_daemon = chainParams.ac_daemon;
      } else if (typeof chainParams[key] === 'object') {
        for (let i = 0; i < chainParams[key].length; i++) {
          herdData.ac_options.push(`-${key}=${chainParams[key][i]}`);
        }
      } else {
        herdData.ac_options.push(`-${key}=${chainParams[key]}`);
      }
    }

    herdData.ac_options = herdData.ac_options.concat(startupParams)

    return new Promise((resolve, reject) => {
      const options = {
        url: `http://127.0.0.1:${api.appConfig.general.main.agamaPort}/api/herd`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          herd: coin === 'CHIPS' ? 'chipsd' : 'komodod',
          options: herdData,
          token: api.appSessionHash,
        }),
      };

      request(options, (error, response, body) => {
        const res = JSON.parse(body)

        if (res.msg === 'success') {
          // Set timeout for "No running daemon message" to be 
          // "Initializing daemon" for a few seconds
          api.coinsInitializing.push(coin)

          setTimeout(() => {
            api.coinsInitializing.splice(api.coinsInitializing.indexOf(coin), 1);
          }, 20000)

          api.log(`${coin} daemon activated successfully`, 'native.confd');
        } else {
          api.log(`${coin} failed to activate, error:`, 'native.confd');
          api.log(res.result, 'native.confd');
        }

        resolve(res);
      });
    });
  }

  /**
   * Function to activate coin daemon in native mode
   */
  api.post('/native/coins/activate', (req, res) => {
    if (api.checkToken(req.body.token)) {
      const { chainTicker, launchConfig } = req.body
      let { startupParams, overrideDaemon, overrideRpcPort } = launchConfig

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

      api.native.activateNativeCoin(chainTicker, startupParams, overrideDaemon, overrideRpcPort)
      .then((result) => {
        const retObj = {
          msg: 'success',
          result,
        };

        res.end(JSON.stringify(retObj));
      })
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