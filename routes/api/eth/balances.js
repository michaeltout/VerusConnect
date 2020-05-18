const ethers = require('ethers');
const Promise = require('bluebird');
const request = require('request');
const erc20ContractId = require('agama-wallet-lib/src/eth-erc20-contract-id');
const decimals = require('agama-wallet-lib/src/eth-erc20-decimals');
const { ETHERSCAN_API_KEY } = require('../../../keys/etherscan')

module.exports = (api) => {  
  api.get('/eth/get_balances', (req, res, next) => {
    const coin = req.query.chainTicker
    let address

    try {
      address = api.eth.get_info(coin).address
    } catch (e) {
      res.end(JSON.stringify({
        msg: 'error',
        result: e.message
      })); 
    }

    let balanceObj = {
      native: {
        public: {
          confirmed: 0,
          unconfirmed: null,
          immature: null,
          interest: null
        },
        private: {
          confirmed: null
        }
      },
      reserve: {}
    }

    api.eth.get_balances(address, coin, req.query.network)
    .then((balance) => {
      balanceObj.native.public.confirmed = balance
      res.end(JSON.stringify(api.eth.parseEthJson(balanceObj))); 
    })
    .catch(e => {
      res.end(JSON.stringify({
        msg: 'error',
        result: e.message
      })); 
    })
  });

  api.eth.get_balances = (address, coin, network = 'homestead') => {
    return new Promise((resolve, reject) => {
      let balancePromise

      if (!coin) balancePromise = api.eth._balance()
      if (coin === 'ETH') balancePromise = api.eth._balanceEtherscan(address, network)
      else balancePromise = api.eth._balanceERC20(address, coin.toUpperCase())

      balancePromise
      .then((balance) => {
        resolve(Number(balance))
      })
      .catch(e => {
        reject(e)
      })
    })
  }

  api.eth._balance = () => {
    return new Promise((resolve, reject) => {
      api.eth.activeWallet.getBalance('pending')
      .then((balance) => {
        resolve(ethers.utils.formatEther(balance, { commify: true }));
      }, (error) => {
        api.log('eth balance error', 'eth.balance');
        api.log(error, 'eth.balance');

        reject(error);
      });
    });
  };

  api.eth._balanceEtherscan = (address, network = 'homestead') => {
    return new Promise((resolve, reject) => {
      const _url = [
        'module=account',
        'action=balance',
        `address=${address}`,
        'tag=latest',
        `apikey=${ETHERSCAN_API_KEY}`,
      ];
      const _etherscanEndPoint = network === 'homestead' ? 'https://api.etherscan.io/api?' : `https://api-${network}.etherscan.io/api?`;
      const options = {
        url: _etherscanEndPoint + _url.join('&'),
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
              resolve(ethers.utils.formatEther(_json.result));
            } else {
              resolve(_json);
            }
          } catch (e) {
            api.log('eth balance parse error', 'eth.balance');
            api.log(e, 'eth.balance');
            reject(e)
          }
        } else {
          api.log(`eth balance error: unable to request ${network}`, 'eth.balance');
          reject(new Error(`Unable to request ${network}`))
        }
      });
    });
  };

  api.eth._balanceERC20 = (address, coin) => {
    const _url = [
      'module=account',
      'action=tokenbalance',
      `address=${address}`,
      `contractaddress=${erc20ContractId[coin]}`,
      'tag=latest',
      `apikey=${ETHERSCAN_API_KEY}`,
    ];

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
              const _decimals = decimals[coin.toUpperCase()];
              resolve(ethers.utils.formatEther(ethers.utils.parseUnits(_json.result, _decimals < 18 && _decimals >= 0 ? 18 - _decimals : 0).toString()));
            } else {
              resolve(_json);
            }
          } catch (e) {
            api.log('etherscan erc20 balance parse error', 'eth.erc20-balance');
            api.log(e, 'eth.erc20-balance');
            reject(e)
          }
        } else {
          api.log(`etherscan erc20 balance error: unable to request ${_url}`, 'eth.erc20-balance');
          reject(new Error(`Unable to request ${_url}`))
        }
      });
    });
  };
  
  api.eth._balanceERC20All = (address) => {
    const _url = `http://api.ethplorer.io/getAddressInfo/${address}?apiKey=${ETHERSCAN_API_KEY}`;
    let _balance = {};

    return new Promise((resolve, reject) => {
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
                _json.address) {
              if (_json.tokens) {
                for (let i = 0; i < _json.tokens.length; i++) {
                  _balance[_json.tokens[i].tokenInfo.coin] = {
                    balance: ethers.utils.formatEther(_json.tokens[i].balance.toString()),                    
                    balanceWei: _json.tokens[i].balance,
                  };
                }
                resolve(_balance);
              }
            } else {
              // TODO: loop active erc20 tokens and return 0 balance
              resolve(_json);
            }
          } catch (e) {
            api.log('ethplorer balance parse error', 'eth.erc20-balance');
            api.log(e, 'eth.erc20-balance');
            reject(e)
          }
        } else {
          api.log(`ethplorer balance error: unable to request http://api.ethplorer.io/getAddressInfo/${address}?apiKey=****`, 'eth.erc20-balance');
          reject(new Error(`Unable to request http://api.ethplorer.io/getAddressInfo/${address}?apiKey=****`))
        }
      });
    });
  };

  api.eth._txcount = () => {
    let _txCount = 0;
    
    api.eth.activeWallet.getTransactionCount('pending')
    .then((transactionCount) => {
      _txCount = transactionCount;
      api.log('eth tx count', transactionCount);

      return transactionCount;
    }, (error) => {
      api.log('eth tx count error', 'eth.txcount');
      api.log(error, 'eth.txcount');
    });
  };

  return api;
};