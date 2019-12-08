const Promise = require('bluebird');

module.exports = (api) => {
  api.get('/electrum/getblockinfo', (req, res, next) => {
    if (api.checkToken(req.query.token)) {
      api.electrumGetBlockInfo(req.query.height, req.query.network)
      .then((json) => {
        const retObj = {
          msg: 'success',
          result: json,
        };

        res.end(JSON.stringify(retObj));
      });
    } else {
      const retObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(retObj));
    }
  });

  api.electrumGetBlockInfo = (height, network) => {
    return new Promise((resolve, reject) => {
      async function _electrumGetBlockInfo() {
        const ecl = await api.ecl(network);

        ecl.connect();
        ecl.blockchainBlockGetHeader(height)
        .then((json) => {
          ecl.close();
          api.log('electrum getblockinfo ==>', 'spv.getblockinfo');
          api.log(json, 'spv.getblockinfo');

          resolve(json);
        });
      }
      _electrumGetBlockInfo();
    });
  }

  api.get('/electrum/getcurrentblock', (req, res, next) => {
    if (api.checkToken(req.query.token)) {
      api.electrumGetCurrentBlock(req.query.network)
      .then((json) => {
        const retObj = {
          msg: 'success',
          result: json,
        };

        res.end(JSON.stringify(retObj));
      });
    } else {
      const retObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(retObj));
    }
  });

  api.electrumGetCurrentBlock = (network) => {
    return new Promise((resolve, reject) => {
      async function _electrumGetCurrentBlock() {
        const ecl = await api.ecl(network);

        ecl.connect();
        ecl.blockchainHeadersSubscribe()
        .then((json) => {
          ecl.close();

          api.log('electrum currentblock (electrum >= v1.1) ==>', 'spv.currentblock');
          api.log(json, 'spv.currentblock');

          if (json &&
              json.hasOwnProperty('block_height')) {
            resolve(json.block_height);
          } else if (
            json &&
            json.hasOwnProperty('height')) {
            resolve(json.height);  
          } else {
            resolve(json);
          }
        });
      };
      _electrumGetCurrentBlock();
    });
  }

  return api;
};