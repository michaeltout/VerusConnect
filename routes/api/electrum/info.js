module.exports = (api) => {  
  api.get('/electrum/get_info', (req, res, next) => {
    if (api.checkToken(req.query.token)) {
      if (!req.query.chainTicker) {
        res.end(JSON.stringify({msg: 'error', result: "No coin passed to electrum get_info"}));
      }
      const coinLc = req.query.chainTicker.toLowerCase()

      if (!api.electrum.coinData[coinLc]) {
        res.end(JSON.stringify({msg: 'error', result: `No coin data found for ${req.query.chainTicker}`}));
      }

      const { name, txfee, server, serverList } = api.electrum.coinData[coinLc]

      res.end(JSON.stringify({msg: 'success', result: {
        protocol: "Electrum",
        name,
        txfee,
        server: `${server.ip}:${server.port}:${server.port}`,
        serverList: serverList.toString()
      }}));
      
    } else {
      const retObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(retObj));
    }
    const coin = req.query.chainTicker;
    let retObj = {}

    try {
      retObj = {
        msg: 'success',
        result: api.electrum.get_info(coin)
      }
    } catch (e) {
      retObj = {
        msg: 'error',
        result: e.message
      }
    }
    
    res.end(JSON.stringify(retObj));  
  });

  return api;
};