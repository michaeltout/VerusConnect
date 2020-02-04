const Promise = require('bluebird');

module.exports = (api) => {    
  api.native.get_identities = (coin, token, includeCanSpend = true, includeCanSign = false, includeWatchOnly = false) => {
    return new Promise((resolve, reject) => {      
      api.native.callDaemon(coin, 'listidentities', [includeCanSpend, includeCanSign, includeWatchOnly], token)
      .then(async (identities) => {
        if (!identities) {
          resolve([])
        } else {
          let formattedIds = identities.slice()
          let txcount = null
          let useCache = true

          try {
            const walletinfo = await api.native.callDaemon(coin, "getwalletinfo", [], token)
            txcount = walletinfo.txcount
          } catch (e) {
            useCache = false
            api.log('Not using address balance cache:', 'get_identities')
            api.log(e, 'get_identities')
          }
          
          for (let i = 0; i < formattedIds.length; i++) {
            try {
              const iAddr = identities[i].identity.identityaddress
              const zAddr = identities[i].identity.privateaddress
              let zBalance = null

              const iBalance = Number(
                await api.native.get_addr_balance(coin, token, iAddr, useCache, txcount)
              )
              
              if (zAddr != null) {
                try {
                  zBalance = Number(
                    await api.native.get_addr_balance(coin, token, zAddr, useCache, txcount)
                  );
                } catch (e) {
                  api.log(e, "get_identities");
                }
              }
              
              formattedIds[i].balances = {
                native: {
                  public: {
                    confirmed: iBalance,
                    unconfirmed: null,
                    immature: null
                  },
                  private: {
                    confirmed: zBalance
                  }
                },
                reserve: {}
              }

              formattedIds[i].addresses = {
                public: [{
                  address: iAddr,
                  balances: {
                    native: iBalance,
                    reserve: {}
                  },
                  tag: "identity"
                }],
                private: zAddr == null ? [] : [{
                  address: zAddr,
                  balances: {
                    native: zBalance,
                    reserve: {}
                  },
                  tag: "sapling"
                }]
              }
            } catch (e) {
              throw e;
            }
          }

          resolve(formattedIds)
        } 
      })
      .catch(err => {
        reject(err)
      })
    });
  };

  api.post('/native/get_identities', (req, res, next) => {    
    const { token, chainTicker, includeCanSpend, includeCanSign, includeWatchOnly } = req.body

    api.native.get_identities(chainTicker, token, includeCanSpend, includeCanSign, includeWatchOnly)
    .then((identities) => {
      const retObj = {
        msg: 'success',
        result: identities,
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

  api.native.get_identity = (coin, token, name) => {
    return new Promise((resolve, reject) => {      
      api.native.callDaemon(coin, 'getidentity', [name], token)
      .then((identity) => {
        resolve(identity)
      })
      .catch(err => {
        reject(err)
      })
    });
  };

  api.post('/native/get_identity', (req, res, next) => {
    const { token, chainTicker, name } = req.body

    api.native.get_identity(chainTicker, token, name)
    .then((identity) => {
      const retObj = {
        msg: 'success',
        result: identity,
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