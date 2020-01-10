const Promise = require('bluebird');

module.exports = (api) => {    
  /**
   * Signs a message given the message, and an identity/address currently in the wallet
   * 
   * @param {String} coin The chainTicker of the coin to make the call on
   * @param {String} token The current API token from the GUI
   * @param {String} address The identity or address to sign the message
   * @param {String} message The message to verify
   * @param {String} cursig The current signature if multisig
   */
  api.native.sign_message = (
    coin,
    token,
    address,
    message,
    cursig = ""
  ) => {
    return new Promise((resolve, reject) => {
      api.native
        .callDaemon(
          coin,
          "signmessage",
          [
            address,
            message,
            cursig
          ],
          token
        )
      .then(resultObj => {
        resolve(resultObj)
      })
      .catch(err => {
        reject(err);
      });
    });
  };

  /**
   * Signs a file given the file, and an identity/address currently in the wallet
   * 
   * @param {String} coin The chainTicker of the coin to make the call on
   * @param {String} token The current API token from the GUI
   * @param {String} address The identity or address to sign the file
   * @param {String} file The file to verify
   * @param {String} cursig The current signature if multisig
   */
  api.native.sign_file = (
    coin,
    token,
    address,
    file,
    cursig = ""
  ) => {
    return new Promise((resolve, reject) => {
      api.native
        .callDaemon(
          coin,
          "signfile",
          [
            address,
            file,
            cursig
          ],
          token
        )
      .then(resultObj => {
        resolve(resultObj)
      })
      .catch(err => {
        reject(err);
      });
    });
  };

  api.post('/native/sign_message', (req, res, next) => {
    const {
      chainTicker,
      token,
      address,
      data,
      cursig
    } = req.body;

    api.native
      .sign_message(
        chainTicker,
        token,
        address,
        data,
        cursig
      )
      .then(resultObj => {
        const retObj = {
          msg: "success",
          result: resultObj
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

  api.post('/native/sign_file', (req, res, next) => {
    const {
      chainTicker,
      token,
      address,
      data,
      cursig
    } = req.body;

    api.native
      .sign_file(
        chainTicker,
        token,
        address,
        data,
        cursig
      )
      .then(resultObj => {
        const retObj = {
          msg: "success",
          result: resultObj
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