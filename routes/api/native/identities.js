const Promise = require('bluebird');

module.exports = (api) => {    
  api.native.get_identities = (coin, token, includeCanSign = false, includeWatchOnly = false) => {
    return new Promise((resolve, reject) => {      
      /*api.native.callDaemon(coin, 'listidentities', [includeCanSign, includeWatchOnly], token)
      .then((identities) => {
        resolve(identities)
      })
      .catch(err => {
        reject(err)
      })*/
      resolve([
        {
          "identity": {
            "version": 1,
            "flags": 0,
            "primaryaddresses": [
              "RJJ4aJDJT6JSMfWGXqoL4Z4wGJCDLVVdJm"
            ],
            "minimumsignatures": 1,
            "identityaddress": "iHkj8ri8xxmZ3jifuxg5z4BoUPQ5a5uYo3",
            "parent": "RQVsJRf98iq8YmRQdehzRcbLGHEx6YfjdH",
            "name": "SwampDoc7or",
            "contentmap": {
            },
            "revocationauthority": "iHkj8ri8xxmZ3jifuxg5z4BoUPQ5a5uYo3",
            "recoveryauthority": "iHkj8ri8xxmZ3jifuxg5z4BoUPQ5a5uYo3",
            "privateaddress": "zs1x2uu8vgz24ntkf8p30lzv759qezyec7vs7etpww7lnsxlm8d3c9u7rak4xe835cdn3q4gnagrr5"
          },
          "blockheight": 3678,
          "balance": 102932,
          "txid": "0bc8f930964135f6288af54b01d3b9b8f5f0c72b7379dc8de9fb6e26470763a8",
          "status": "active",
          "canspendfor": true,
          "cansignfor": true
        },
        {
          "identity": {
            "version": 1,
            "flags": 0,
            "primaryaddresses": [
              "RJJ4aJDJT6JSMfWGXqoL4Z4wGJCDLVVdJm"
            ],
            "minimumsignatures": 1,
            "identityaddress": "iHkj8ri8xxmZ3jifuxg5z4BoUPQ5a5uYo3",
            "parent": "RQVsJRf98iq8YmRQdehzRcbLGHEx6YfjdH",
            "name": "Michael",
            "contentmap": {
            },
            "revocationauthority": "iHkj8ri8xxmZ3jifuxg5z4BoUPQ5a5uYo3",
            "recoveryauthority": "iHkj8ri8xxmZ3jifuxg5z4BoUPQ5a5uYo3",
            "privateaddress": "zs1x2uu8vgz24ntkf8p30lzv759qezyec7vs7etpww7lnsxlm8d3c9u7rak4xe835cdn3q4gnagrr5"
          },
          "blockheight": 3678,
          "balance": 102932,
          "txid": "0bc8f930964135f6288af54b01d3b9b8f5f0c72b7379dc8de9fb6e26470763a8",
          "status": "active",
          "canspendfor": false,
          "cansignfor": true
        },
        {
          "identity": {
            "version": 1,
            "flags": 0,
            "primaryaddresses": [
              "RJJ4aJDJT6JSMfWGXqoL4Z4wGJCDLVVdJm"
            ],
            "minimumsignatures": 1,
            "identityaddress": "iHkj8ri8xxmZ3jifuxg5z4BoUPQ5a5uYo3",
            "parent": "RQVsJRf98iq8YmRQdehzRcbLGHEx6YfjdH",
            "name": "Bobaroni",
            "contentmap": {
            },
            "revocationauthority": "iHkj8ri8xxmZ3jifuxg5z4BoUPQ5a5uYo3",
            "recoveryauthority": "iHkj8ri8xxmZ3jifuxg5z4BoUPQ5a5uYo3",
            "privateaddress": "zs1x2uu8vgz24ntkf8p30lzv759qezyec7vs7etpww7lnsxlm8d3c9u7rak4xe835cdn3q4gnagrr5"
          },
          "blockheight": 3678,
          "balance": 0,
          "txid": "0bc8f930964135f6288af54b01d3b9b8f5f0c72b7379dc8de9fb6e26470763a8",
          "status": "active",
          "canspendfor": true,
          "cansignfor": true
        }
      ])
    });
  };

  api.post('/native/get_identities', (req, res, next) => {    
    const { token, coin, includeCanSign, includeWatchOnly } = req.body

    api.native.get_identities(coin, token, includeCanSign, includeWatchOnly)
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
    const { token, coin, name } = req.body

    api.native.get_identity(coin, token, name)
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

  api.native.register_id_name = (coin, token, name, controlAddress, referralId) => {
    return new Promise((resolve, reject) => {      
      let params = referralId ? [name, controlAddress, referralId] : [name, controlAddress]
      api.native.callDaemon(coin, 'registernamecommitment', params, token)
      .then((nameCommitmentResult) => {
        if (
          nameCommitmentResult &&
          nameCommitmentResult.txid &&
          nameCommitmentResult.namereservation
        ) {
          const localCommitments = api.loadLocalCommitments()

          api.saveLocalCommitments({
            ...localCommitments,
            [coin]: localCommitments[coin] ? [...localCommitments[coin], nameCommitmentResult] : [nameCommitmentResult]
          });
          resolve(nameCommitmentResult);
        } else {
          throw new Error(nameCommitmentResult)
        }
      })
      .catch(err => {
        reject(err)
      })
    });
  };

  api.post('/native/register_id_name', (req, res, next) => {
    const { token, coin, name, controlAddress, referralId } = req.body

    api.native.register_id_name(coin, token, name, controlAddress, referralId)
    .then((nameCommitmentResult) => {
      const retObj = {
        msg: 'success',
        result: nameCommitmentResult,
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

  api.native.get_name_commitments = (coin) => {
    try {
      const nameCommits = api.loadLocalCommitments()

      if (nameCommits[coin] == undefined) {
        api.saveLocalCommitments({
          ...nameCommits,
          [coin]: []
        });

        return []
      } else {
        return nameCommits[coin]
      }
    } catch (e) {
      throw (e)
    }
  };

  api.post('/native/get_name_commitments', (req, res, next) => {
    const { token, chainTicker } = req.body
    const coin = chainTicker

    if (api.checkToken(token)) {
      try {
        const retObj = {
          msg: 'success',
          result: api.native.get_name_commitments(coin),
        };

        res.end(JSON.stringify(retObj));
      } catch (e) {
        const retObj = {
          msg: 'error',
          result: e.message,
        };

        res.end(JSON.stringify(retObj));
      }
    } else {
      const retObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(retObj));
    }
  });

  /**
   * Registers an ID given the information from a previous name commitment
   * @param {String} coin The chainTicker of the coin that the ID is based on
   * @param {String} token The current API token from the GUI
   * @param {String} name The name of the ID to reserve
   * @param {String} txid The txid of the name reservation transaction
   * @param {String} salt The salt given as a result from the name reservation
   * @param {String[]} primaryaddresses An array of the primary addresses for this id
   * @param {Number} minimumsignatures The minimum signitures required to sign a tx for this ID
   * @param {String[]} contenthashes The content to initially attach to this id
   * @param {String} revocationauthorityid The ID that can revoke this ID
   * @param {String} recoveryauthorityid The ID that can recover this ID
   * @param {String} privateaddress The private address attached to this ID
   * @param {Number} idFee The amount the user is willing to pay for their ID (min 100)
   */
  api.native.register_id = (
    coin,
    token,
    name,
    txid,
    salt,
    primaryaddresses,
    minimumsignatures = 1,
    contenthashes = [],
    revocationauthorityid,
    recoveryauthorityid,
    privateaddress
  ) => {
    const idJson = {
      txid,
      namereservation: {
        name,
        salt
      },
      identity: {
        name,
        primaryaddresses,
        minimumsignatures,
        contenthashes,
        revocationauthorityid,
        recoveryauthorityid,
        privateaddress
      }
    }

    return new Promise((resolve, reject) => {
      api.native
        .callDaemon(
          coin,
          "registeridentity",
          [idJson, idFee],
          token
        )
        .then(idRegistryResult => {
          resolve(idRegistryResult);
        })
        .catch(err => {
          reject(err);
        });
    });
  };

  api.post('/native/register_id', (req, res, next) => {
    const {
      token,
      coin,
      name,
      txid,
      salt,
      primaryaddresses,
      minimumsignatures,
      contenthashes,
      revocationauthorityid,
      recoveryauthorityid,
      privateaddress
    } = req.body;

    api.native
      .register_id(
        coin,
        token,
        name,
        txid,
        salt,
        primaryaddresses,
        minimumsignatures,
        contenthashes,
        revocationauthorityid,
        recoveryauthorityid,
        privateaddress
      )
      .then(idRegistryResult => {
        const retObj = {
          msg: "success",
          result: idRegistryResult
        };

        res.end(JSON.stringify(retObj));
      })
      .catch(error => {
        const retObj = {
          msg: "error",
          result: error.message
        };

        res.end(JSON.stringify(retObj));
      });
  });
  

  return api;
};