const Promise = require('bluebird');
const request = require('request');

module.exports = (api) => {
  api.fiat.supportedCurrencies = [
    'AUD', 
    'BRL', 
    'GBP', 
    'BGN',
    'CAD',
    'HRK',
    'CZK',
    'CNY',
    'DKK',
    'EUR',
    'HKD',
    'HUF',
    'INR',
    'IDR',
    'ILS',
    'JPY',
    'KRW',
    'MYR',
    'MXN',
    'NZD',
    'NOK',
    'PHP',
    'PLN',
    'RON',
    'RUB',
    'SGD',
    'ZAR',
    'SEK',
    'CHF',
    'THB',
    'TRY',
    'USD'
  ]

  /**
   * Fetches price for specified cryptocurrency (uppercase ticker) from atomic explorer 
   * in specified currency. If no currency specified, fetches price in all available currencies.
   */
  api.fiat.get_fiatprice = (coin, currency = null) => {
    return new Promise((resolve, reject) => {  
      const options = {
        url: `https://www.atomicexplorer.com/api/mm/prices/v2?currency=${currency != null ? currency : api.fiat.supportedCurrencies.join()}&coins=${coin}&pricechange=true`,
        method: 'GET',
        timeout: 120000,
      };
  
      request(options, (error, response, body) => {
        if (response &&
          response.statusCode &&
          response.statusCode === 200) {
          try {
            const _json = JSON.parse(body);

            if (_json.result && _json.msg === 'success') {
              if (!_json.result.hasOwnProperty(coin)) {
                reject(new Error(`No fiat value found for ${coin}.`))
              } else if (currency != null && !_json.result[coin].hasOwnProperty(currency)) {
                reject(new Error(`Fiat currency ${currency} not supported by atomic explorer.`))
              } else {
                resolve({
                  msg: _json.msg,
                  result: _json.result[coin]
                });
              }
            } else {
              reject(new Error(_json.result))
            }
          } catch (e) {
            api.log('atomic explorer price parse error', 'fiat.prices');
            api.log(e, 'fiat.prices');
            reject(e)
          }
        } else {
          api.log(`atomic explorer price error: unable to request ${options.url}`, 'fiat.prices');
          reject(new Error(`Unable to request ${options.url}`))
        }
      });
    });
  }

  //TODO: Clean this up to be one function without making GUI component messier
  api.get('/native/get_fiatprice', (req, res, next) => {
    const coin = req.query.chainTicker
    const currency = req.query.currency

    api.fiat.get_fiatprice(coin, currency)
    .then((priceObj) => {
      res.end(JSON.stringify(priceObj)); 
    })
    .catch(e => {
      res.end(JSON.stringify({
        msg: 'error',
        result: e.message
      })); 
    })
  });

  api.get('/eth/get_fiatprice', (req, res, next) => {
    const coin = req.query.chainTicker
    const currency = req.query.currency

    api.fiat.get_fiatprice(coin, currency)
    .then((priceObj) => {
      res.end(JSON.stringify(priceObj)); 
    })
    .catch(e => {
      res.end(JSON.stringify({
        msg: 'error',
        result: e.message
      })); 
    })
  });

  api.get('/electrum/get_fiatprice', (req, res, next) => {
    const coin = req.query.chainTicker
    const currency = req.query.currency

    api.fiat.get_fiatprice(coin, currency)
    .then((priceObj) => {
      res.end(JSON.stringify(priceObj)); 
    })
    .catch(e => {
      res.end(JSON.stringify({
        msg: 'error',
        result: e.message
      })); 
    })
  });

  return api
}
