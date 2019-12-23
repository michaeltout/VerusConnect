module.exports = (api) => {
  /*
   *  type: GET
   *
   */
  //TODO: Re-evauluate as POST or eliminate use of API token
  /*api.get('/InstantDEX/allcoins', (req, res, next) => {
    if (api.checkToken(req.query.token)) {
      let retObj;
      let nativeCoindList = [];
      let electrumCoinsList = [];
      let ethereumCoins = [];

      for (let key in api.electrum.coinData) {
        if (key !== 'auth') {
          electrumCoinsList.push(key.toUpperCase());
        }
      }

      for (let key in api.coindInstanceRegistry) {
        nativeCoindList.push(key === 'komodod' ? 'KMD' : key);
      }

      for (let key in api.eth.coins) {
        ethereumCoins.push(key);
      }

      retObj = {
        native: nativeCoindList,
        spv: electrumCoinsList,
        eth: ethereumCoins,
        total: nativeCoindList.length + electrumCoinsList.length + ethereumCoins.length,
        params: api.native.startParams,
      };

      res.end(JSON.stringify(retObj));
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