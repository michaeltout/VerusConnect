const Promise = require('bluebird');

module.exports = (api) => {    
  api.native.register_id_name = (coin, token, name, referralId) => {
    return new Promise((resolve, reject) => {      
      let params = referralId ? [name, null, referralId] : [name, null]
      let controlAddress

      api.native.callDaemon(coin, 'getnewaddress', [], token)
      .then(newAddress => {
        params[1] = newAddress
        controlAddress = newAddress

        return api.native.callDaemon(coin, 'registernamecommitment', params, token)
      })
      .then((nameCommitmentResult) => {
        if (
          nameCommitmentResult &&
          nameCommitmentResult.txid &&
          nameCommitmentResult.namereservation
        ) {
          let localCommitments = api.loadLocalCommitments()
          let saveCommitment = { ...nameCommitmentResult, controlAddress }

          if (localCommitments[coin]) {
            const existingIndex = localCommitments[coin].findIndex((value) => value.namereservation.name === name)
            
            if (existingIndex !== -1) {
              localCommitments[coin][existingIndex] = saveCommitment
            } else {
              localCommitments[coin] = [...localCommitments[coin], saveCommitment]
            }
          } else {
            localCommitments[coin] = [saveCommitment]
          }

          api.saveLocalCommitments(localCommitments);

          resolve({...saveCommitment, coin});
        } else {
          throw new Error(nameCommitmentResult)
        }
      })
      .catch(err => {
        reject(err)
      })
    });
  };

  api.native.register_id_name_preflight = (coin, token, name, referralId) => {
    return new Promise((resolve, reject) => {      
      resolve({ namereservation: { coin, name, referral: referralId } });
    });
  };

  api.post('/native/register_id_name', (req, res, next) => {
    const { token, chainTicker, name, referralId } = req.body

    api.native.register_id_name(chainTicker, token, name, referralId)
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

  api.post('/native/register_id_name_preflight', (req, res, next) => {
    const { token, chainTicker, name, referralId } = req.body

    api.native.register_id_name_preflight(chainTicker, token, name, referralId)
    .then((preflightRes) => {
      const retObj = {
        msg: 'success',
        result: preflightRes,
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

  api.native.delete_name_commitment = (name, coin) => {
    try {
      let nameCommits = api.loadLocalCommitments()
      
      if (nameCommits[coin] == undefined) {
        api.saveLocalCommitments({
          ...nameCommits,
          [coin]: []
        });

        return false
      } else {
        newNameCommits = {
          ...nameCommits,
          [coin]: nameCommits[coin].filter(nameCommit => {

            return nameCommit.namereservation.name !== name
          })
        }
        
        api.saveLocalCommitments(newNameCommits);
        return true
      }
    } catch (e) {
      throw (e)
    }
  }

  api.post('/native/delete_name_commitment', (req, res, next) => {
    const { token, chainTicker, name } = req.body

    if (api.checkToken(token)) {
      try {
        const retObj = {
          msg: 'success',
          result: api.native.delete_name_commitment(name, chainTicker),
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

  return api;
};