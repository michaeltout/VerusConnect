const request = require('request');
const Promise = require('bluebird');
const { ethTransactionsToBtc } = require('agama-wallet-lib/src/eth');
const erc20ContractId = require('agama-wallet-lib/src/eth-erc20-contract-id');
const decimals = require('agama-wallet-lib/src/eth-erc20-decimals');
const { ETHERSCAN_API_KEY } = require('../../../keys/etherscan')

module.exports = (api) => {  
  api.get('/eth/get_transactions', (req, res, next) => {
    let address;
    const network = req.query.network || 'homestead';
    const coin = req.query.chainTicker;

    try {
      address = api.eth.get_info(coin).address
    } catch (e) {
      res.end(JSON.stringify({
        msg: 'error',
        result: e.message
      })); 
    }
    
    if (coin && coin !== 'ETH') {
      api.eth._transactionsERC20(address, coin)
      .then((transactions) => {
        res.end(JSON.stringify(api.eth.parseEthJson(transactions)));  
      })
      .catch(e => {
        const retObj = {
          msg: 'error',
          result: e.message,
        };
    
        res.end(JSON.stringify(retObj));  
      });
    } else {
      api.eth._transactions(address, network)
      .then((transactions) => {
        res.end(JSON.stringify(api.eth.parseEthJson(transactions)));  
      })
      .catch(e => {
        const retObj = {
          msg: 'error',
          result: e.message,
        };
    
        res.end(JSON.stringify(retObj));  
      });
    }
  });
  
  api.eth._transactions = (address, network = 'homestead', sort = 'asc') => {
    return new Promise((resolve, reject) => {
      const _url = [
        'module=account',
        'action=txlist',
        `address=${address}`,
        'startblock=0',
        'endblock=99999999',
        `sort=${sort}`,
        `apikey=${ETHERSCAN_API_KEY}`,
      ];
      const _etherscanEndPoint = network === 'homestead' ? 'https://api.etherscan.io/api?' : `https://api-${network}.etherscan.io/api?`;
      const options = {
        url: _etherscanEndPoint + _url.join('&'),
        method: 'GET',
      };

      request(options, (error, response, body) => {
        if (response && response.statusCode && response.statusCode === 200) {
          try {
            const _json = JSON.parse(body);

            if (
              (_json.message === "OK" ||
                _json.message === "No transactions found" ||
                _json.status === "1" ||
                _json.status === "0") &&
              _json.result
            ) {
              const _txs = ethTransactionsToBtc(_json.result, address);
              resolve(_txs);
            } else {
              throw new Error("ETH transactions not OK.");
            }
          } catch (e) {
            api.log("eth transactions parse error", "eth.transactions");
            api.log(e, "eth.transactions");
            throw e;
          }
        } else {
          api.log(
            `eth transactions error: unable to request ${network}`,
            "eth.transactions"
          );
          throw new Error(`Unable to request ${network}`);
        }
      });
    });
  };
  
  api.eth._transactionsERC20 = (address, coin, sort = 'asc', page = 1, offset = 100) => {
    return new Promise((resolve, reject) => {
      const _url = [
        'module=account',
        'action=tokentx',
        `address=${address}`,
        `contractaddress=${erc20ContractId[coin.toUpperCase()]}`,
        //'startblock=0',
        //'endblock=99999999',
        //`page=${page}'
        //`offset=100&sort=asc
        `sort=${sort}`,
        `apikey=${ETHERSCAN_API_KEY}`,
      ];
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

            if ((_json.message === 'OK' || _json.message === 'No transactions found') &&
                _json.result) {
              const _decimals = decimals[coin.toUpperCase()];
              const _txs = ethTransactionsToBtc(_json.result, address, true, _decimals < 18 && _decimals >= 0 ? 18 - _decimals : 0);
              resolve(_txs);
            } else {
              resolve(_json);
            }
          } catch (e) {
            api.log('eth transactions erc20 parse error', 'eth.transactions');
            api.log(e, 'eth.transactions');
            reject(e)
          }
        } else {
          api.log(`eth transactions erc20 error: unable to request ${'https://api.etherscan.io/api?' + _url.join('&')}`, 'eth.transactions');
          reject(new Error(`Unable to request ${'https://api.etherscan.io/api?' + _url.join('&')}`))
        }
      });
    });
  };

  return api;
};