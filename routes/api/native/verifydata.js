const Promise = require('bluebird');

module.exports = (api) => {    
  /**
   * Verifies a message signed by an identity or address
   * 
   * @param {String} coin The chainTicker of the coin that the ID is based on
   * @param {String} token The current API token from the GUI
   * @param {String} address The identity or address that signed the message to verify
   * @param {String} message The message to verify
   * @param {String} signature The signature provided by the signer
   * @param {Boolean} checklatest If true, checks signature validity based on latest identity. defaults to false,
   * which determines validity of signing height stored in signature.
   */
  api.native.verify_message = (
    coin,
    token,
    address,
    message,
    signature,
    checklatest = false
  ) => {
    return new Promise((resolve, reject) => {
      api.native
        .callDaemon(
          coin,
          "verifymessage",
          [
            address,
            signature,
            message,
            checklatest
          ],
          token
        )
      .then(verificationResult => {
        resolve(verificationResult)
      })
      .catch(err => {
        reject(err);
      });
    });
  };

  /**
   * Verifies a hash signed by an identity or address
   * 
   * @param {String} coin The chainTicker of the coin that the ID is based on
   * @param {String} token The current API token from the GUI
   * @param {String} address The identity or address that signed the message to verify
   * @param {String} hash The hash to verify
   * @param {String} signature The signature provided by the signer
   * @param {Boolean} checklatest If true, checks signature validity based on latest identity. defaults to false,
   * which determines validity of signing height stored in signature.
   */
  api.native.verify_hash = (
    coin,
    token,
    address,
    hash,
    signature,
    checklatest = false
  ) => {
    return new Promise((resolve, reject) => {
      api.native
        .callDaemon(
          coin,
          "verifyhash",
          [
            address,
            signature,
            hash,
            checklatest
          ],
          token
        )
      .then(verificationResult => {
        resolve(verificationResult)
      })
      .catch(err => {
        reject(err);
      });
    });
  };

  /**
   * Verifies a file signed by an identity or address
   * 
   * @param {String} coin The chainTicker of the coin that the ID is based on
   * @param {String} token The current API token from the GUI
   * @param {String} address The identity or address that signed the file to verify
   * @param {String} file The file location of the file to verify
   * @param {String} signature The signature provided by the signer
   * @param {Boolean} checklatest If true, checks signature validity based on latest identity. defaults to false,
   * which determines validity of signing height stored in signature.
   */
  api.native.verify_file = (
    coin,
    token,
    address,
    file,
    signature,
    checklatest = false
  ) => {
    return new Promise((resolve, reject) => {
      api.native
        .callDaemon(
          coin,
          "verifyfile",
          [
            address,
            signature,
            file,
            checklatest
          ],
          token
        )
      .then(verificationResult => {
        resolve(verificationResult)
      })
      .catch(err => {
        reject(err);
      });
    });
  };

  api.post('/native/verify_message', (req, res, next) => {
    const {
      chainTicker,
      token,
      address,
      data,
      signature,
      checklatest
    } = req.body;

    api.native
      .verify_message(
        chainTicker,
        token,
        address,
        data,
        signature,
        checklatest
      )
      .then(verificationResult => {
        const retObj = {
          msg: "success",
          result: verificationResult
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

  api.post('/native/verify_hash', (req, res, next) => {
    const {
      chainTicker,
      token,
      address,
      data,
      signature,
      checklatest
    } = req.body;

    api.native
      .verify_hash(
        chainTicker,
        token,
        address,
        data,
        signature,
        checklatest
      )
      .then(verificationResult => {
        const retObj = {
          msg: "success",
          result: verificationResult
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

  api.post('/native/verify_file', (req, res, next) => {
    const {
      chainTicker,
      token,
      address,
      data,
      signature,
      checklatest
    } = req.body;

    api.native
      .verify_file(
        chainTicker,
        token,
        address,
        data,
        signature,
        checklatest
      )
      .then(verificationResult => {
        const retObj = {
          msg: "success",
          result: verificationResult
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