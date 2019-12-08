const Promise = require('bluebird');

module.exports = (api) => {  
  api.native.getAddressType = (address) => {
    if (address[0] === 'z') {
      if (address[1] === 'c') return 'sprout'
      if (address[1] === 's') return 'sapling'
    } else {
      return 'public'
    }
  }
  
  api.native.get_addresses = (coin, token, includePrivate) => {
    return new Promise((resolve, reject) => {
      let addressPromises = [api.native.callDaemon(coin, 'getaddressesbyaccount', [''], token)]
      if (includePrivate) addressPromises.push(api.native.callDaemon(coin, 'z_listaddresses', [], token))
      
      Promise.all(addressPromises)
      .then(async (jsonResults) => {
        let resObj = {
          public: [],
          private: []
        }
        
        for (let j = 0; j < jsonResults.length; j++) {
          let addressListResult = jsonResults[j]
          
          for (let i = 0; i < addressListResult.length; i++) {
            const address = addressListResult[i]
            const addrTag = api.native.getAddressType(address)
            let balanceObj = {native: 0, reserve: {}}
            
            try {
              //DELET
              console.log(j)
              console.log(i)

              balanceObj.native = Number(await api.native.callDaemon(coin, 'z_getbalance', [address], token))

              resObj[
                addrTag === "sprout" || addrTag === "sapling"
                  ? "private"
                  : "public"
              ].push({ address, tag: addrTag, balances: balanceObj });
              
              //DELET
              console.log(resObj)
            } catch (e) {
              //DELET
              console.error(e)
              throw e
            }
          }
        }

        //DELET
        console.log(resObj)
        
        resolve(resObj)
      })
      .catch(err => {
        reject(err)
      })
    });
  };

  api.native.validate_address = (coin, token, address) => {
    let isZAaddr = false
    if (address[0] === 'z') isZAaddr = true

    return new Promise((resolve, reject) => {
      api.native.callDaemon(coin, isZAaddr ? 'z_validateaddress' : 'validateaddress', [address], token)
      .then((jsonResult) => {
        resolve(jsonResult)
      })
      .catch(err => {
        reject(err)
      })
    })
  }

  api.native.get_privkey = (coin, token, address) => {
    let isZAaddr = false
    if (address[0] === 'z') isZAaddr = true

    return new Promise((resolve, reject) => {
      api.native.callDaemon(coin, isZAaddr ? 'z_exportkey' : 'dumpprivkey', [address], token)
      .then((jsonResult) => {
        resolve(jsonResult)
      })
      .catch(err => {
        reject(err)
      })
    })
  }

  api.native.get_newaddress = (coin, token, zAddress) => {
    return new Promise((resolve, reject) => {
      api.native.callDaemon(coin, zAddress ? 'z_getnewaddress' : 'getnewaddress', [], token)
      .then((jsonResult) => {
        resolve(jsonResult)
      })
      .catch(err => {
        reject(err)
      })
    })
  }

  api.post('/native/get_newaddress', (req, res, next) => {
    const token = req.body.token;
    const zAddress = req.body.zAddress;
    const coin = req.body.chainTicker;

    api.native.get_newaddress(coin, token, zAddress)
    .then((newAddr) => {
      const retObj = {
        msg: 'success',
        result: newAddr,
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

  api.post('/native/get_addresses', (req, res, next) => {
    const token = req.body.token;
    const includePrivate = req.body.includePrivate;
    const coin = req.body.chainTicker;

    api.native.get_addresses(coin, token, includePrivate)
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

  api.post('/native/get_pubkey', (req, res, next) => {
    const token = req.body.token;
    const coin = req.body.chainTicker;
    const address = req.body.address

    api.native.validate_address(coin, token, address)
    .then((validation) => {
      if (!validation.pubkey) throw new Error(`No pubkey found for ${address}`)

      const retObj = {
        msg: 'success',
        result: validation.pubkey,
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

  api.post('/native/get_privkey', (req, res, next) => {
    const token = req.body.token;
    const coin = req.body.chainTicker;
    const address = req.body.address

    api.native.get_privkey(coin, token, address)
    .then((privkey) => {
      if (!privkey) throw new Error(`No privkey found for ${address}`)

      const retObj = {
        msg: 'success',
        result: privkey,
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