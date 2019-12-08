module.exports = (api) => {  
  api.electrum.get_addresses = (coin) => {
    const coinLc = coin.toLowerCase()
    let addresses = {
      public: [],
      private: []
    }

    return new Promise((resolve, reject) => {
      if (!api.electrumKeys[coinLc] || !api.electrumKeys[coinLc].pub) {
        throw new Error(`No address found for ${coin}`);
      }

      addresses.public.push({address: api.electrumKeys[coinLc].pub, tag: 'public'})

      Promise.all(addresses.public.map((addressObj) => {
        return api.electrum.get_balances(addressObj.address, coin)
      }))
      .then((addressBalances) => {
        addresses.public = addresses.public.map((addressObj, index) => {
          return {...addressObj, balances: {native: addressBalances[index].confirmed, reserve: {}}}
        })

        resolve(addresses)
      })
      .catch(err => {
        reject(err)
      })
    });
  };

  api.post('/electrum/get_pubkey', (req, res, next) => {
    const coin = req.body.chainTicker;
    const token = req.body.token;
    const coinLc = coin.toLowerCase()

    if (api.checkToken(token)) {
      if (api.electrumKeys[coinLc] && api.electrumKeys[coinLc].pubHex) {
        res.end(JSON.stringify({
          msg: 'success',
          result: api.electrumKeys[coinLc].pubHex
        }));  
      } else {
        res.end(JSON.stringify({
          msg: 'error',
          result: `No pubkey found for electrum coin ${coin}`
        }));  
      }
    } else {
      res.end(JSON.stringify({
        msg: 'error',
        result: 'unauthorized access'
      }));  
    }
  });

  api.post('/electrum/get_privkey', (req, res, next) => {
    const coin = req.body.chainTicker;
    const token = req.body.token;
    const coinLc = coin.toLowerCase()

    if (api.checkToken(token)) {
      if (api.electrumKeys[coinLc] && api.electrumKeys[coinLc].priv) {
        res.end(JSON.stringify({
          msg: 'success',
          result: api.electrumKeys[coinLc].priv
        }));  
      } else {
        res.end(JSON.stringify({
          msg: 'error',
          result: `No privkey found for electrum coin ${coin}`
        }));  
      }
    } else {
      res.end(JSON.stringify({
        msg: 'error',
        result: 'unauthorized access'
      }));  
    }
  });

  api.get('/electrum/get_addresses', (req, res, next) => {
    const coin = req.query.chainTicker;

    if (!req.query.chainTicker) {
      res.end(JSON.stringify({msg: 'error', result: "No coin passed to electrum get_addresses"}));
    }
    
    api.electrum.get_addresses(coin)
    .then((addresses) => {
      const retObj = {
        msg: 'success',
        result: addresses,
      };
  
      res.end(JSON.stringify(retObj));  
    })
    .catch(error => {
      const retObj = {
        msg: 'error',
        result: error.message,
      };
  
      res.end(JSON.stringify(retObj));  
    })
  });

  return api;
};