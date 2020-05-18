const {
  CURRENCY_BLACKLIST,
  CURRENCY_WHITELIST,
  CURRENCY_GRAYLIST,
  WHITELIST_DESC,
  BLACKLIST_DESC,
  GRAYLIST_DESC
} = require("../utils/constants/index");

module.exports = (api) => {
  // Blacklist
  api.loadCurrencyBlacklist = () =>
    api.loadJsonFile(CURRENCY_BLACKLIST, BLACKLIST_DESC);
  api.saveCurrencyBlacklist = (blacklist) =>
    api.saveJsonFile(blacklist, CURRENCY_BLACKLIST, BLACKLIST_DESC);

  // Whitelist
  api.loadCurrencyWhitelist = () =>
    api.loadJsonFile(CURRENCY_WHITELIST, WHITELIST_DESC);
  api.saveCurrencyWhitelist = (whitelist) =>
    api.saveJsonFile(whitelist, CURRENCY_WHITELIST, WHITELIST_DESC);

  api.get('/load_currency_blacklist', (req, res, next) => {
    api.native.loadCurrencyBlacklist()
    .then((blacklist) => {
      const retObj = {
        msg: 'success',
        result: blacklist,
      };
  
      res.end(JSON.stringify(retObj));  
    })
    .catch(error => {
      const retObj = {
        msg: 'error',
        result: error.message,
      };
  
      res.end(JSON.stringify(retObj));  
    })
  });

  api.get('/load_currency_whitelist', (req, res, next) => {
    api.native.loadCurrencyWhitelist()
    .then((whitelist) => {
      const retObj = {
        msg: 'success',
        result: whitelist,
      };
  
      res.end(JSON.stringify(retObj));  
    })
    .catch(error => {
      const retObj = {
        msg: 'error',
        result: error.message,
      };
  
      res.end(JSON.stringify(retObj));  
    })
  });

  api.get('/save_currency_blacklist', (req, res, next) => {
    const { token, blacklist } = req.body
   
    if (api.checkToken(token)) {
      try {
        const retObj = {
          msg: 'success',
          result: api.saveCurrencyBlacklist(blacklist),
        };

        res.end(JSON.stringify(retObj));
      } catch (e) {
        const retObj = {
          msg: 'error',
          result: e.message,
        };

        res.end(JSON.stringify(retObj));
      }
    } else {
      const retObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(retObj));
    }
  });

  api.get('/save_currency_whitelist', (req, res, next) => {
    const { token, whitelist } = req.body
   
    if (api.checkToken(token)) {
      try {
        const retObj = {
          msg: 'success',
          result: api.saveCurrencyWhitelist(whitelist),
        };

        res.end(JSON.stringify(retObj));
      } catch (e) {
        const retObj = {
          msg: 'error',
          result: e.message,
        };

        res.end(JSON.stringify(retObj));
      }
    } else {
      const retObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(retObj));
    }
  });

  // Graylist (moved to native api, and called on interval due to expected change of getting this data from blockchain)
  api.loadCurrencyGraylist = () => api.loadJsonFile(CURRENCY_GRAYLIST, GRAYLIST_DESC)
  api.saveCurrencyGraylist = (graylist) => api.saveJsonFile(graylist, CURRENCY_GRAYLIST, GRAYLIST_DESC)

  return api;
};