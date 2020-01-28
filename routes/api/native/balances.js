const Promise = require('bluebird');

const PRIVATE = 1
const PUBLIC = 0

module.exports = (api) => {    
  api.native.get_balances = (coin, token, includePrivate) => {
    return new Promise((resolve, reject) => {
      let balancePromises = [api.native.callDaemon(coin, 'getwalletinfo', [], token)]
      if (includePrivate || coin === 'KMD') balancePromises.push(api.native.callDaemon(coin, 'z_gettotalbalance', [], token))
      //KMD Interest is only found in z_gettotalbalance
      
      Promise.all(balancePromises)
      .then((jsonResults) => {
        let balances = {
          native: {
            public: {
              confirmed: null,
              unconfirmed: null,
              immature: null,
              interest: null,
              staking: null
            },
            private: {
              confirmed: null
            }
          },
          reserve: {}
        }

        jsonResults.map((balanceObj, index) => {
          if (index === PUBLIC) {
            balances.native.public.confirmed = Number(balanceObj['balance'])
            balances.native.public.unconfirmed = Number(balanceObj['unconfirmed_balance'])
            balances.native.public.immature = Number(balanceObj['immature_balance'])
            balances.native.public.staking = Number(balanceObj['eligible_staking_balance'])
          } else if (index === PRIVATE) {
            balances.native.private.confirmed = Number(balanceObj['private'])
            balances.native.public.interest = Number(balanceObj['interest'])
          }
        })

        resolve(balances)
      })
      .catch(err => {
        reject(err)
      })
    });
  };

  api.post('/native/get_balances', (req, res, next) => {
    const token = req.body.token;
    const includePrivate = req.body.includePrivate;
    const coin = req.body.chainTicker;

    api.native.get_balances(coin, token, includePrivate)
    .then((balances) => {
      const retObj = {
        msg: 'success',
        result: balances,
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