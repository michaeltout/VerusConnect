const Promise = require('bluebird');

module.exports = (api) => {    
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
   * @param {String} revocationauthority The ID that can revoke this ID
   * @param {String} recoveryauthority The ID that can recover this ID
   * @param {String} privateaddress The private address attached to this ID
   * @param {Number} idFee The amount the user is willing to pay for their ID (min 100)
   * @param {Number} referral The referral for this ID (optional)
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
    revocationauthority,
    recoveryauthority,
    privateaddress,
    idFee,
    referral
  ) => {
    let idJson = {
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
        revocationauthority,
        recoveryauthority,
        privateaddress
      }
    }

    if (referral) {
      idJson.namereservation.referral = referral
    }

    return new Promise((resolve, reject) => {
      let paramArray = [idJson]
      if (idFee != null) paramArray.push(idFee)

      api.native
        .callDaemon(
          coin,
          "registeridentity",
          paramArray,
          token
        )
        .then(idRegistryResult => {
          resolve({
            chainTicker: coin,
            name,
            txid,
            primaryaddress: primaryaddresses[0],
            minimumsignatures,
            revocationauthority,
            recoveryauthority,
            privateaddress,
            idFee,
            referral,
            resulttxid: idRegistryResult
          })
        })
        .catch(err => {
          reject(err);
        });
    });
  };

  //TODO: Add more checks in here as well
  api.native.register_id_preflight = (
    coin,
    token,
    name,
    txid,
    salt,
    primaryaddresses,
    minimumsignatures = 1,
    contenthashes = [],
    revocationauthority,
    recoveryauthority,
    privateaddress,
    idFee,
    referral
  ) => {
    return new Promise((resolve, reject) => {
      resolve({
        chainTicker: coin,
        name,
        txid,
        primaryaddress: primaryaddresses[0],
        minimumsignatures,
        revocationauthority,
        recoveryauthority,
        privateaddress,
        idFee,
        referral
      })
    });
  };

  api.post('/native/register_id', (req, res, next) => {
    const {
      token,
      chainTicker,
      name,
      txid,
      salt,
      primaryaddresses,
      minimumsignatures,
      contenthashes,
      revocationauthority,
      recoveryauthority,
      privateaddress,
      idFee,
      referral
    } = req.body;

    api.native
      .register_id(
        chainTicker,
        token,
        name,
        txid,
        salt,
        primaryaddresses,
        minimumsignatures,
        contenthashes,
        revocationauthority,
        recoveryauthority,
        privateaddress,
        idFee,
        referral
      )
      .then(idObj => {
        const retObj = {
          msg: "success",
          result: idObj
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

  api.post('/native/register_id_preflight', (req, res, next) => {
    const {
      token,
      chainTicker,
      name,
      txid,
      salt,
      primaryaddresses,
      minimumsignatures,
      contenthashes,
      revocationauthority,
      recoveryauthority,
      privateaddress,
      idFee,
      referral
    } = req.body;

    api.native
      .register_id_preflight(
        chainTicker,
        token,
        name,
        txid,
        salt,
        primaryaddresses,
        minimumsignatures,
        contenthashes,
        revocationauthority,
        recoveryauthority,
        privateaddress,
        idFee,
        referral
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