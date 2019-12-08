module.exports = (api) => {  
  api.get('/eth/get_info', (req, res, next) => {
    const coin = req.query.chainTicker;
    let retObj = {}
    

    try {
      const { name, ensAddress, chainId } = api.eth.get_info(coin)._network

      retObj = {
        msg: 'success',
        result: {
          protocol: 'Ethereum',
          network: name,
          ensAddress,
          chainId
        }
      }
    } catch (e) {
      retObj = {
        msg: 'error',
        result: e.message
      }
    }
    
    res.end(JSON.stringify(retObj));  
  });

  api.eth.get_info = (coin = 'ETH') => {
    if (api.eth.connect[coin]) {
      return {...api.eth.connect[coin].provider, address: api.eth.connect[coin].signingKey.address}
    } else {
      throw new Error(`${coin} hasnt been connected to yet, eth tokens need to be connected to be used.`)
    }
  }

  return api;
};