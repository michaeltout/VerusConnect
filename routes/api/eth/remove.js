module.exports = (api) => {
  api.post('/eth/remove_coin', (req, res) => {
    const _chain = req.body.chainTicker

    if (api.checkToken(req.body.token)) {
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
