const passwdStrength = require('passwd-strength');

module.exports = (api) => {
  /*
   *  type: GET
   *
   */
  //TODO: Re-evauluate as POST or eliminate use of API token
  /*api.get('/auth/status', (req, res, next) => {
    if (api.checkToken(req.query.token)) {
      let retObj;
      let _status = true;
      const _electrumCoins = JSON.parse(JSON.stringify(api.electrum.coinData));
      delete _electrumCoins.auth;

      if (!api.seed &&
          (Object.keys(_electrumCoins).length || Object.keys(api.eth.coins).length)) {
        _status = false;
      }

      retObj = {
        status: _status ? 'unlocked' : 'locked',
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

  api.checkToken = (token) => {
    if (token === api.appSessionHash) {
      return true;
    }
  };

  api.checkStringEntropy = (str) => {
    // https://tools.ietf.org/html/rfc4086#page-35
    return passwdStrength(str) < 29 ? false : true;
  };

  api.isWatchOnly = () => {
    return api.argv && api.argv.watchonly === 'override' ? false : api._isWatchOnly;
  };

  return api;
};