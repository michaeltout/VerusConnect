const Promise = require('bluebird');

module.exports = (api) => {  
  api.native.getAddressType = (address) => {
    if (address[0] === 'z') {
      if (address[1] === 'c') return 'sprout'
      if (address[1] === 's') return 'sapling'
    } else if (address[0] === 'i') {
      return 'identity'
    } else {
      return 'public'
    }
  }
  
  api.native.get_addresses = (coin, token, includePrivate) => {
    return new Promise((resolve, reject) => {
      let addressPromises = [api.native.callDaemon(coin, 'listaddressgroupings', [], token)]
      if (includePrivate) {
        addressPromises.push(api.native.callDaemon(coin, 'z_listaddresses', [], token))
        addressPromises.push(api.native.callDaemon(coin, 'z_gettotalbalance', [], token))
      }
      
      Promise.all(addressPromises)
      .then(async (jsonResults) => {
        let resObj = {
          public: [],
          private: []
        }
        let pubAddrsSeen = []

        // Compile public addresses
        jsonResults[0].forEach(addressGrouping => {
          addressGrouping.forEach(addressArr => {
            if (!pubAddrsSeen.includes(addressArr[0])) {
              let balanceObj = {native: addressArr[1], reserve: {}}

              // Addresses that start with an 'R' and dont include an account field are labeled
              // as change
              let tag =
                addressArr[0][0] === "R" && addressArr.length < 3
                  ? "change"
                  : api.native.getAddressType(addressArr[0]);

              // Only include change addresses if they have a balance
              if (tag !== 'change' || (tag === 'change' && addressArr[1] > 0)) {
                resObj.public.push({ address: addressArr[0], tag, balances: balanceObj })
              }
              
              pubAddrsSeen.push(addressArr[0])
            }
          })
        })
        
        if (jsonResults.length > 1) {
          //Compile private addresses
          const privateAddrListResult = jsonResults[1]
          const totalZBalance = Number(jsonResults[2].private)
          let zBalanceSeen = 0
                  
          for (let i = 0; i < privateAddrListResult.length; i++) {
            const address = privateAddrListResult[i]
            const addrTag = api.native.getAddressType(address)
            let balanceObj = {native: 0, reserve: {}}
            
            try {
              //If z_balance has been reached, stop checking balances, improves performance
              if (zBalanceSeen < totalZBalance) {
                balanceObj.native = Number(await api.native.callDaemon(coin, 'z_getbalance', [address], token))
                zBalanceSeen += balanceObj.native
              } else {
                balanceObj.native = 0
              }
              
              resObj.private.push({ address, tag: addrTag, balances: balanceObj });
            } catch (e) {
              throw e
            }
          }
        }
        
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
      if (!validation.pubkey && !validation.scriptPubKey) throw new Error(`No pubkey found for ${address}`)

      const retObj = {
        msg: 'success',
        result: validation.pubkey ? validation.pubkey : validation.scriptPubkey,
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