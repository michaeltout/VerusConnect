const ethers = require('ethers');
const Promise = require('bluebird');
const request = require('request');
const fees = require('agama-wallet-lib/src/fees');
const { maxSpend } = require('agama-wallet-lib/src/eth');
const erc20ContractId = require('agama-wallet-lib/src/eth-erc20-contract-id');
const standardABI = require('agama-wallet-lib/src/erc20-standard-abi');
const decimals = require('agama-wallet-lib/src/eth-erc20-decimals');
const { ETHERSCAN_API_KEY } = require('../../../keys/etherscan')

// TODO: error handling, input vars check

// speed: slow, average, fast
module.exports = (api) => {  
  api.get('/eth/createtx', (req, res, next) => {
    const coin = req.query.coin ? req.query.coin.toUpperCase() : null;
    const push = req.query.push && (req.query.push === true || req.query.push === 'true') ? req.query.push : false;
    const gasLimit = req.query.gaslimit || fees[coin.toLowerCase()];
    const getGas = req.query.getgas ? req.query.getgas : false;
    const speed = req.query.speed ? req.query.speed : 'average';
    const dest = req.query.dest ? req.query.dest : null;
    const network = req.query.network ? req.query.network : 'homestead';
    const amount = req.query.amount ? req.query.amount : 0;
    let gasPrice = !getGas ? api.eth.gasPrice : null;
    let adjustedAmount = 0;

    api.eth._balanceEtherscan(
      api.eth.wallet.signingKey.address,
      network
    )
    .then((maxBalance) => {
      const _createtx = () => {
        const fee = ethers.utils.formatEther(ethers.utils.bigNumberify(gasLimit).mul(ethers.utils.bigNumberify(gasPrice[speed])));
        const _adjustedAmount = maxSpend(maxBalance.balance, fee, amount);
        const _adjustedAmountWei = Number(ethers.utils.parseEther(Number(_adjustedAmount).toPrecision(8)).toString());
  
        if (!push) {
          const data = {
            coin,
            network,
            address: api.eth.wallet.signingKey.address,
            dest, 
            push,
            gasLimit,
            gasPrice,
            gasPriceUsed: gasPrice[speed],
            speed,
            fee,
            feeWei: ethers.utils.bigNumberify(gasLimit).mul(ethers.utils.bigNumberify(gasPrice[speed])).toString(),
            amount,
            amountWei: ethers.utils.parseEther(Number(amount).toPrecision(8)).toString(),
            adjustedAmount: _adjustedAmount,
            adjustedAmountWei: _adjustedAmountWei,
            maxBalance,
            //connect: api.eth.connect,
          };

          api.log('tx data', 'eth.createtx');
          api.log(data, 'eth.createtx');
          
          const retObj = {
            msg: 'success',
            result: data,
          };

          res.end(JSON.stringify(retObj));
        } else {
          api.eth.connect[coin].sendTransaction({
            to: dest,
            value: _adjustedAmountWei,
            gasPrice: ethers.utils.bigNumberify(gasPrice[speed]),
            gasLimit,
          })
          .then((tx) => {
            api.log('eth tx pushed', 'eth.createtx');
            api.log(tx, 'eth.createtx');

            tx.txid = tx.hash;
            
            const retObj = {
              msg: 'success',
              result: tx,
            };

            res.end(JSON.stringify(retObj));
          }, (error) => {
            const retObj = {
              msg: 'error',
              result: tx,
            };

            res.end(JSON.stringify(retObj));
          });
        }
      };

      if (getGas) {
        api.log('request gasprice', 'eth.createtx');
        api._getGasPrice()
        .then((_gasPrice) => {
          api.log('received gasprice', 'eth.createtx');
          api.log(_gasPrice, 'eth.createtx');
          gasPrice = _gasPrice;

          _createtx();
        });
      } else {
        _createtx();
      }
    });
  });

  api.eth._getContractABI = (address) => {
    const _url = [
      'module=contract',
      'action=getabi',
      `address=${address}`,
      `apikey=${ETHERSCAN_API_KEY}`,
    ];
    let _balance = {};

    return new Promise((resolve, reject) => {
      const options = {
        url: 'https://api.etherscan.io/api?' + _url.join('&'),
        method: 'GET',
      };
      
      request(options, (error, response, body) => {
        if (response &&
            response.statusCode &&
            response.statusCode === 200) {
          try {
            const _json = JSON.parse(body);

            if (_json.message === 'OK' &&
                _json.result) {
              try {
                const _abi = JSON.parse(_json.result);
                resolve(_abi);
              } catch (e) {
                api.log('etherscan erc20 contact abi parse error', 'eth.erc20-abi');
                api.log(e, 'eth.erc20-abi');
              }
            } else {
              resolve(false);
            }
          } catch (e) {
            api.log('etherscan erc20 contact abi parse error', 'eth.erc20-abi');
            api.log(e, 'eth.erc20-abi');
          }
        } else {
          api.log(`etherscan erc20 contact abi error: unable to request ${_url}`, 'eth.erc20-balance');
        }
      });
    });
  };

  api.get('/eth/erc20/abi', (req, res, next) => {
    const symbol = req.query.symbol ? req.query.symbol : null;    
    
    api.eth._getContractABI(erc20ContractId[symbol.toUpperCase()])
    .then((abi) => {
      const retObj = {
        msg: 'success',
        result: abi,
      };
  
      res.end(JSON.stringify(retObj)); 
    })
  });

  api.get('/eth/createtx/erc20', (req, res, next) => {
    const push = req.query.push && (req.query.push === true || req.query.push === 'true') ? req.query.push : false;
    const speed = req.query.speed ? req.query.speed : 'average';
    const dest = req.query.dest ? req.query.dest : null;
    const amount = req.query.amount ? req.query.amount : 0;
    const symbol = req.query.symbol ? req.query.symbol : null;
    const _contract = erc20ContractId[symbol.toUpperCase()];
    let gasPrice = api.eth.gasPrice;
    let adjustedAmount = 0;

    api.eth._balanceEtherscan(
      api.eth.wallet.signingKey.address,
      'homestead'
    )
    .then((maxBalance) => {
      const contractAddress = erc20ContractId[symbol.toUpperCase()];
      const contract = new ethers.Contract(contractAddress, standardABI, api.eth.connect[symbol.toUpperCase()]);
      const numberOfDecimals = decimals[symbol.toUpperCase()] || 18;
      const numberOfTokens = ethers.utils.parseUnits(amount, numberOfDecimals);

      api.log(`${symbol.toUpperCase()} decimals ${decimals[symbol.toUpperCase()]}`);
      
      if (!push) {
        contract.estimate.transfer(contractAddress, numberOfTokens)
        .then((estimate) => {
          const _estimate = estimate.toString();
          api.log(`erc20 ${symbol.toUpperCase()} transfer estimate ${_estimate}`);
          api.log(`gas price ${gasPrice[speed]}`);

          const _fee = ethers.utils.bigNumberify(_estimate).mul(ethers.utils.bigNumberify(gasPrice[speed]));
          const _balanceAferFee = ethers.utils.bigNumberify(maxBalance.balanceWei).sub(_fee).toString();

          const retObj = {
            msg: 'success',
            result: {
              gasLimit: _estimate,
              gasPrice: ethers.utils.bigNumberify(gasPrice[speed]).toString(),
              feeWei: _fee.toString(),
              fee: ethers.utils.formatEther(_fee.toString()),
              maxBalance,
              balanceAfterFeeWei: _balanceAferFee,
              balanceAferFee: ethers.utils.formatEther(_balanceAferFee.toString()),
              notEnoughBalance: Number(_balanceAferFee) > 0 ? false : true,
            },
          };
    
          res.end(JSON.stringify(retObj));
        });
      } else {
        contract.transfer(dest, numberOfTokens, {
          gasPrice: ethers.utils.bigNumberify(gasPrice[speed]),
        })
        .then((tx) => {
          api.log('erc20 tx pushed', 'eth.createtx');
          api.log(tx, 'eth.createtx');

          tx.txid = tx.hash;
          
          const retObj = {
            msg: 'success',
            result: tx,
          };

          res.end(JSON.stringify(retObj));
        }, (error) => {
          const retObj = {
            msg: 'error',
            result: error,
          };

          res.end(JSON.stringify(retObj));
        });
      }
    });
  });

  api.get('/eth/erc20/info', (req, res, next) => {
    const symbol = req.query.symbol ? req.query.symbol : null;    
    
    api.eth._tokenInfo(symbol.toUpperCase())
    .then((tokenInfo) => {
      const retObj = {
        msg: 'success',
        result: tokenInfo,
      };
  
      res.end(JSON.stringify(retObj)); 
    })
  });

  api.eth._tokenInfo = (symbol) => {
    const _url = `https://api.ethplorer.io/getTokenInfo/${erc20ContractId[symbol.toUpperCase()]}?apiKey=${ETHERSCAN_API_KEY}`;

    return new Promise((resolve, reject) => {
      if (!api.eth.tokenInfo[symbol.toUpperCase()]) {
        const options = {
          url: _url,
          method: 'GET',
        };

        request(options, (error, response, body) => {
          if (response &&
              response.statusCode &&
              response.statusCode === 200) {
            try {
              const _json = JSON.parse(body);

              if (_json &&
                  _json.address &&
                  _json.decimals) {
                api.eth.tokenInfo[symbol.toUpperCase()] = _json;
                resolve(_json);
              } else {
                resolve(false);
              }
            } catch (e) {
              api.log('ethplorer token info parse error', 'eth.erc20-tokeninfo');
              api.log(e, 'eth.erc20-tokeninfo');
            }
          } else {
            api.log(`ethplorer balance error: unable to request ${_url}`, 'eth.erc20-tokeninfo');
          }
        });
      } else {
        resolve(api.eth.tokenInfo[symbol.toUpperCase()]);
      }
    });
  };

  return api;
};