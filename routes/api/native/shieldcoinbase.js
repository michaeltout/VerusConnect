module.exports = (api) => {  
  /**
   * Readies the parameters to pass to z_shieldcoinbase and returns 
   * the inputted information for the user to double check it
   * @param {String} chainTicker The chainticker to call z_shieldcoinbase on
   * @param {String} toAddress The Z address to shield coinbases to
   * @param {String} fromAddress The from address, leave undefined to get all addresses
   * @param {Number} fee (Optional) A custom fee
   * @param {Number} limit (Optional) A custom limit of UTXOs to shield
   */
  api.native.shieldCoinbasePreflight = (
    chainTicker,
    toAddress,
    fromAddress,
    fee,
    limit
  ) => {
    const FROM_ADDR_INDEX = 0
    let inputParams = [fromAddress, toAddress, fee, limit]
    let txParams = []

    inputParams.map((inputParam, index) => {
      if (index === FROM_ADDR_INDEX && inputParam === null) txParams.push("*")
      else if (inputParam != null) {
        txParams.push(inputParam)
      }
    })

    return {
      chainTicker,
      fromAddress,
      toAddress,
      fee,
      limit,
      txParams
    };
  };

  api.post('/native/shieldcoinbase', (req, res, next) => {
    const token = req.body.token;

    if (api.checkToken(token)) {
      const {
        chainTicker,
        fromAddress,
        toAddress,
        fee,
        limit
      } = req.body;

      const preflightRes = api.native.shieldCoinbasePreflight(
        chainTicker,
        toAddress,
        fromAddress,
        fee,
        limit
      )

      api.native.callDaemon(chainTicker, 'z_shieldcoinbase', preflightRes.txParams, token)
      .then(shieldObj => {
        const retObj = {
          msg: "success",
          result: { ...preflightRes, ...shieldObj }
        };
        res.end(JSON.stringify(retObj));
      }).catch(e => {
        const retObj = {
          msg: "error",
          result: e.message
        };
        res.end(JSON.stringify(retObj));
      })
    } else {
      const retObj = {
        msg: "error",
        result: "unauthorized access"
      };
      res.end(JSON.stringify(retObj));
    }
  });

  api.post("/native/shieldcoinbase_preflight", (req, res, next) => {
    const token = req.body.token;

    if (api.checkToken(token)) {
      const {
        chainTicker,
        fromAddress,
        toAddress,
        fee,
        limit
      } = req.body;

      try {
        res.end(
          JSON.stringify({
            msg: "success",
            result: api.native.shieldCoinbasePreflight(
              chainTicker,
              toAddress,
              fromAddress,
              fee,
              limit
            )
          })
        );
      } catch (e) {
        const retObj = {
          msg: "error",
          result: e.message
        };
        res.end(JSON.stringify(retObj));
      }
    } else {
      const retObj = {
        msg: "error",
        result: "unauthorized access"
      };
      res.end(JSON.stringify(retObj));
    }
  });
    
  return api;
};