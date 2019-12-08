module.exports = (api) => {
  api.post('/electrum/remove_coin', (req, res) => {
    if (api.checkToken(req.body.token)) {
      const _chain = req.body.chainTicker;
      delete api.electrum.coinData[_chain.toLowerCase()];

      if (Object.keys(api.electrum.coinData).length - 1 === 0) {
        api.electrumKeys = {};
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
