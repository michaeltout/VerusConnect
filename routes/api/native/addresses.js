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
      let addressPromises = [
        api.native.callDaemon(coin, "listaddressgroupings", [], token),
        api.native.callDaemon(coin, "getaddressesbyaccount", [""], token),
        api.native.callDaemon(coin, "z_gettotalbalance", [], token)
      ];

      if (includePrivate) {
        addressPromises.push(
          api.native.callDaemon(coin, "z_listaddresses", [], token)
        );
      }

      Promise.all(addressPromises)
        .then(async jsonResults => {
          let resObj = {
            public: [],
            private: []
          };
          let pubAddrsSeen = [];
          let zBalanceSeen = (tBalanceSeen = 0);

          const addressGroupings = jsonResults[0];
          const addressesByAccount = jsonResults[1];
          const totalBalance = jsonResults[2];
          const privateAddrListResult =
            jsonResults.length > 3 ? jsonResults[3] : [];

          // Compile public addresses
          addressGroupings.forEach(addressGrouping => {
            addressGrouping.forEach(addressArr => {
              if (!pubAddrsSeen.includes(addressArr[0])) {
                let balanceObj = { native: addressArr[1], reserve: {} };
                tBalanceSeen += addressArr[1]

                // Addresses that start with an 'R' and dont include an account field are labeled
                // as change
                let tag =
                  addressArr[0][0] === "R" && addressArr.length < 3
                    ? "change"
                    : api.native.getAddressType(addressArr[0]);

                // Only include change addresses if they have a balance
                if (
                  tag !== "change" ||
                  (tag === "change" && addressArr[1] > 0)
                ) {
                  resObj.public.push({
                    address: addressArr[0],
                    tag,
                    balances: balanceObj
                  });
                }

                pubAddrsSeen.push(addressArr[0]);
              }
            });
          });

          //Compile private addresses and addresses not covered by listaddressgroupings
          let fullAddrList = privateAddrListResult.concat(addressesByAccount);

          const totalZBalance = Number(totalBalance.private);
          const totalTBalance = Number(totalBalance.transparent);

          for (let i = 0; i < fullAddrList.length; i++) {
            const address = fullAddrList[i];

            if (!pubAddrsSeen.includes(address)) {
              const addrTag = api.native.getAddressType(address);
              const isZ = addrTag === "sapling" || addrTag === "sprout";
              let balanceObj = { native: 0, reserve: {} };

              try {
                //If balance for type has been reached, stop checking balances, improves performance
                if (
                  (isZ && zBalanceSeen < totalZBalance) ||
                  (!isZ && tBalanceSeen < totalTBalance)
                ) {                  
                  balanceObj.native = Number(
                    await api.native.callDaemon(
                      coin,
                      "z_getbalance",
                      [address],
                      token
                    )
                  );

                  isZ
                    ? (zBalanceSeen += balanceObj.native)
                    : (tBalanceSeen += balanceObj.native);
                } else {
                  balanceObj.native = 0;
                }

                const addrObj = {
                  address,
                  tag: addrTag,
                  balances: balanceObj
                }

                isZ ? resObj.private.push(addrObj) : resObj.public.push(addrObj)
              } catch (e) {
                throw e;
              }
            }
          }

          resolve(resObj);
        })
        .catch(err => {
          reject(err);
        });
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