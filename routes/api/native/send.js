module.exports = (api) => {  
  api.native.encodeMemo = (memo) => {
    var hex;
    var i;
  
    var result = "";
    for (i = 0; i < memo.length; i++) {
      hex = memo.charCodeAt(i).toString(16);
      result += ("000"+hex).slice(-4);
    }
  
    return result;
  }

  /**
   * Function to create object that gets passed to sendtx. This object is 
   * also used to display confirmation data to the user. The resulting
   * object contains information about the transaction, as well as parameters (txParams)
   * that will get passed to sendtx
   * @param {String} chainTicker (required) The chain ticker to send from
   * @param {String} toAddress (required) The address or id to send to
   * @param {Number} amount (optional, default = 0) The amount to send, leave blank for message transactions
   * @param {Number} balance (required) The balance in the balance that is going to be sent from
   * @param {String} fromAddress (optional, if no custom fee or z_addresses involved) The address to send from, or in a pre-convert, the refund address
   * @param {Number} customFee (optional, forces fromAddress) The custom fee to send with the transaction
   * @param {String} memo (optional, forces send to z_address) The memo to include with the transaction to be sent to the receiver
   * @param {String} toChain (optional, forces all pbaas params to be required) The PBaaS chain to send to 
   * @param {Boolean} toNative (optional, forces all pbaas params to be required) auto-convert from Verus reserve to PBaaS currency at market price
   * @param {Boolean} toReserve (optional, forces all pbaas params to be required) auto-convert from PBaaS to Verus reserve currency at market price
   * @param {Boolean} preConvert (optional, forces all pbaas params to be required) auto-convert to PBaaS currency at market price, this only works if the order is mined before block start of the chain
   * @param {Number} lastPriceInRoot (optional) The last price of the chain to send to vs the chain to send from, for display purposes
   */
  api.native.txPreflight = async (
    chainTicker,
    toAddress,
    amount = 0,
    balance,
    fromAddress,
    customFee,
    memo,
    toChain,
    toNative,
    toReserve,
    preConvert,
    lastPriceInRoot = 0
  ) => {
    let cliCmd
    let txParams
    let warnings = []

    //TODO: Change for sendreserve
    let fee = 0.0001
    let spendAmount = amount
    let deductedAmount = Number((spendAmount + fee).toFixed(8))

    try {
      const balances = await api.native.get_balances(chainTicker, api.appSessionHash, false)
      const { interest } = balances.native.public

      if (deductedAmount > balance) {
        if (interest == null || interest == 0) {
          warnings.push({
            field: "value",
            message: `Original amount + fee (${deductedAmount}) is larger than balance, amount has been changed.`
          });
        }
        
        spendAmount = Number((spendAmount - fee).toFixed(8));
        deductedAmount = Number((spendAmount + fee).toFixed(8));
      }
  
      if (fromAddress || toAddress[0] === "z" || customFee != null) {
        cliCmd = "z_sendmany";
        if (customFee) fee = customFee;
        if (!fromAddress) throw new Error("You must specify a from address in a private transaction.")
  
        txParams = [
          fromAddress,
          [
            {
              address: toAddress,
              amount: spendAmount
            }
          ],
          1,
          fee
        ];
  
        if (memo) {
          if (toAddress[0] !== 'z') throw new Error("Memos can only be attached to transactions going to z addresses.")
          txParams[1][0].memo = api.native.encodeMemo(memo);
        }
      } else if (
        toChain ||
        toNative != null ||
        toReserve != null ||
        preConvert != null
      ) {
        cliCmd = "sendreserve";
        txParams = [
          {
            name: toChain,
            paymentaddress: toAddress,
            refundaddress: fromAddress,
            amount: spendAmount,
            tonative: toNative ? 1 : 0,
            toreserve: toReserve ? 1 : 0,
            preconvert: preConvert ? 1 : 0,
            subtractfee: 0
          }
        ];
      } else {
        cliCmd = "sendtoaddress";
        txParams = [toAddress, spendAmount];
      }

      let remainingBalance = balance != null && deductedAmount != null ? (balance - deductedAmount).toFixed(8) : 0
      if (remainingBalance < 0) throw new Error("Insufficient funds")
  
      if (interest != null && interest > 0) {
        if (cliCmd !== "sendtoaddress") {
          warnings.unshift({
            field: "interest",
            message:
              `You have ${interest} ${chainTicker} in unclaimed interest that may be lost if you send this transaction, ` +
              `claim it first to ensure you do not lose it.`
          });
        } else {
          remainingBalance = (Number(remainingBalance) + (2 * interest)).toFixed(8)
          deductedAmount -= interest
        }
      } 
      
      return {
        cliCmd,
        txParams,
        chainTicker,
        to: toAddress,
        from: fromAddress ? fromAddress : cliCmd === 'sendtoaddress' ? 'Transparent Funds' : null,
        balance: balance ? balance.toFixed(8) : balance,
        value: spendAmount,
        interest: interest == null || interest == 0 ? null : interest,
        fee: fee ? fee.toFixed(8) : fee,
        message: memo,
        total: deductedAmount ? deductedAmount.toFixed(8) : deductedAmount,
        lastPrice: lastPriceInRoot ? lastPriceInRoot.toFixed(8) : lastPriceInRoot,
        remainingBalance,
        warnings,
      };
    } catch (e) {
      throw e
    }
  };

  api.post('/native/sendtx', async (req, res, next) => {
    const token = req.body.token;

    if (api.checkToken(token)) {
      const {
        chainTicker,
        toAddress,
        amount,
        balance,
        fromAddress,
        customFee,
        memo,
        toChain,
        toNative,
        toReserve,
        preConvert,
        lastPriceInRoot
      } = req.body;

      try {
        const preflightRes = await api.native.txPreflight(
          chainTicker,
          toAddress,
          amount,
          balance,
          fromAddress,
          customFee,
          memo,
          toChain,
          toNative,
          toReserve,
          preConvert,
          lastPriceInRoot
        )

        api.native.callDaemon(chainTicker, preflightRes.cliCmd, preflightRes.txParams, token)
        .then(txid => {
          const retObj = {
            msg: "success",
            result: { ...preflightRes, txid }
          };
          res.end(JSON.stringify(retObj));
        }).catch(e => {
          const retObj = {
            msg: "error",
            result: e.message
          };
          res.end(JSON.stringify(retObj));
        })
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

  api.post("/native/tx_preflight", async (req, res, next) => {
    const token = req.body.token;

    if (api.checkToken(token)) {
      const {
        chainTicker,
        toAddress,
        amount,
        balance,
        fromAddress,
        customFee,
        memo,
        toChain,
        toNative,
        toReserve,
        preConvert,
        lastPriceInRoot
      } = req.body;

      try {
        res.end(
          JSON.stringify({
            msg: "success",
            result: await api.native.txPreflight(
              chainTicker,
              toAddress,
              amount,
              balance,
              fromAddress,
              customFee,
              memo,
              toChain,
              toNative,
              toReserve,
              preConvert,
              lastPriceInRoot
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