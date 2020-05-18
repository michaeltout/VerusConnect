const ethers = require('ethers');
const Promise = require('bluebird');
const request = require('request');
const fees = require('agama-wallet-lib/src/fees');
const { maxSpend } = require('agama-wallet-lib/src/eth');
const erc20ContractId = require('agama-wallet-lib/src/eth-erc20-contract-id');
const standardABI = require('agama-wallet-lib/src/erc20-standard-abi');
const decimals = require('agama-wallet-lib/src/eth-erc20-decimals');

// TODO: error handling, input vars check

// speed: slow, average, fast
module.exports = (api) => {  
  api.eth.createPreflightObj = (chainTicker, toAddress, fromAddress, balance, amount, gasLimit, gasPrice, numberOfTokens) => {
    const fee = Number(ethers.utils.formatEther(ethers.utils.bigNumberify(gasLimit).mul(ethers.utils.bigNumberify(gasPrice))));
    let spendAmount = Number(amount)
    let deductedAmount = (spendAmount + fee).toFixed(8)
    let warnings = []
    
    if (deductedAmount > balance) {
      warnings.push({field: "value", message: `Original amount + fee (${deductedAmount}) is larger than balance, amount has been changed.`})
      spendAmount = Number((spendAmount - fee).toFixed(8));
      deductedAmount = Number((spendAmount + fee).toFixed(8));
    }

    return ({
      chainTicker,
      to: toAddress,
      from: fromAddress,
      balance,
      value: spendAmount,
      fee,
      total: deductedAmount,
      remainingBalance: balance - deductedAmount,
      gasPrice: ethers.utils.bigNumberify(gasPrice),
      gasLimit,
      warnings,
      numberOfTokens
    })
  }

  api.eth.txPreflight = (chainTicker, toAddress, amount, speed = 'average', network = 'homestead') => {
    let gasPrice = {}
    let maxBalance = {}
    const fromAddress = api.eth.wallet.signingKey.address

    return new Promise((resolve, reject) => {
      Promise.all([
        chainTicker === "ETH"
          ? api.eth._balanceEtherscan(fromAddress, network)
          : api.eth._balanceERC20(fromAddress, chainTicker),
        api._getGasPrice(),
      ])
        .then((ethNetworkInfo) => {
          maxBalance = ethNetworkInfo[0];
          gasPrice = ethNetworkInfo[1][speed];

          try {
            ethers.utils.getAddress(toAddress);
          } catch (e) {
            throw new Error(
              `"${toAddress}" is not a valid ${chainTicker} address.`
            );
          }

          if (chainTicker === "ETH") {
            const gasLimit = fees[chainTicker.toLowerCase()];
            const preflightObj = api.eth.createPreflightObj(
              chainTicker,
              toAddress,
              fromAddress,
              maxBalance,
              amount,
              gasLimit,
              gasPrice
            );

            if (preflightObj.remainingBalance < 0)
              throw new Error("Insufficient funds");

            resolve(preflightObj);
          } else {
            const contractAddress = erc20ContractId[chainTicker.toUpperCase()];

            const contract = new ethers.Contract(
              contractAddress,
              standardABI,
              api.eth.connect[chainTicker.toUpperCase()]
            );
            const numberOfDecimals = decimals[chainTicker.toUpperCase()] || 18;
            const numberOfTokens = ethers.utils.parseUnits(
              amount.toString(),
              numberOfDecimals
            );

            return contract.estimate
              .transfer(contractAddress, numberOfTokens)
              .then((gasLimit) => {
                const preflightObj = api.eth.createPreflightObj(
                  chainTicker,
                  toAddress,
                  fromAddress,
                  maxBalance,
                  amount,
                  gasLimit,
                  gasPrice,
                  numberOfTokens,
                  contract
                );

                if (preflightObj.remainingBalance < 0)
                  throw new Error("Insufficient funds");

                resolve(preflightObj);
              });
          }
        })
        .catch((err) => {
          reject(err);
        });
    })
  }

  api.post('/eth/sendtx', (req, res, next) => {
    const token = req.body.token;

    if (api.checkToken(token)) {
      const { toAddress, amount, chainTicker, speed, network } = req.body
      let txResult = {}

      api.eth.txPreflight(chainTicker, toAddress, amount, speed, network)
      .then(preflightObj => {
        txResult = preflightObj
        const { to, value, gasPrice, gasLimit, numberOfTokens } = txResult;
        
        return chainTicker === "ETH"
          ? api.eth.connect[chainTicker].sendTransaction({
              to,
              value: ethers.utils.parseEther(Number(value).toPrecision(8)),
              gasPrice: Number(gasPrice),
              gasLimit: Number(gasLimit)
            })
          : new ethers.Contract(
            erc20ContractId[chainTicker.toUpperCase()],
            standardABI,
            api.eth.connect[chainTicker.toUpperCase()]
          ).transfer(to, numberOfTokens, { gasPrice });
      })
      .then(tx => {
        const retObj = {
          msg: 'success',
          result: {
            ...txResult,
            txid: tx.hash
          },
        };
        res.end(JSON.stringify(retObj));
      })
      .catch(e => {
        const retObj = {
          msg: 'error',
          result: e.message,
        };
        res.end(JSON.stringify(retObj));
      })
    } else {
      const retObj = {
        msg: 'error',
        result: 'unauthorized access',
      };
      res.end(JSON.stringify(retObj));
    }
  });

  api.post('/eth/tx_preflight', (req, res, next) => {
    const token = req.body.token;

    if (api.checkToken(token)) {
      const { toAddress, amount, chainTicker, speed, network } = req.body

      api.eth.txPreflight(chainTicker, toAddress, amount, speed, network)
      .then(preflightObj => {
        res.end(JSON.stringify({
          msg: 'success',
          result: preflightObj,
        }));
      })
      .catch(e => {
        const retObj = {
          msg: 'error',
          result: e.message,
        };
        res.end(JSON.stringify(retObj));
      })
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