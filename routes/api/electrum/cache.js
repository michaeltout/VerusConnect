const fs = require('fs-extra');
const _fs = require('graceful-fs');
const fsnode = require('fs');
const Promise = require('bluebird');
const {
  parseBlock,
  electrumMerkleRoot,
} = require('agama-wallet-lib/src/block');
const btcnetworks = require('agama-wallet-lib/src/bitcoinjs-networks');
const dpowCoins = require('agama-wallet-lib/src/electrum-servers-dpow');

// TODO: dpow confs cache storage, eth/erc20 pending txs cache 

module.exports = (api) => {
  api.updatePendingTxCache = (network, txid, options) => {
    if (options.remove &&
        api.electrumCache.pendingTx &&
        api.electrumCache.pendingTx[network] &&
        api.electrumCache.pendingTx[network][txid]) {
      api.log(`pending txs cache remove ${network} txid ${txid}`, 'spv.cache.pending');
      delete api.electrumCache.pendingTx[network][txid];

      if (!Object.keys(api.electrumCache.pendingTx[network]).length) {
        delete api.electrumCache.pendingTx[network];
      }
    } else {
      if (!api.electrumCache.pendingTx) {
        api.electrumCache.pendingTx = {};
      }
      if (!api.electrumCache.pendingTx[network]) {
        api.electrumCache.pendingTx[network] = {};
      }

      api.electrumCache.pendingTx[network][txid] = {
        pub: options.pub,
        rawtx: options.rawtx,
      };
      api.log(`pending txs cache add ${network} txid ${txid} pub ${options.pub}`, 'spv.cache.pending');
    }

    api.log('pending txs cache', 'spv.cache.pending');
    api.log(api.electrumCache.pendingTx, 'spv.cache.pending');
  };

  api.findPendingTxByAddress = (network, pub) => {
    let _items = [];

    if (api.electrumCache.pendingTx &&
        api.electrumCache.pendingTx[network] &&
        Object.keys(api.electrumCache.pendingTx[network]).length) {
      const _txs = api.electrumCache.pendingTx[network];
      
      for (let key in _txs) {
        if (_txs[key].pub === pub) {
          _items.push({
            txid: key,
            rawtx: api.electrumCache.pendingTx[network][key].rawtx, 
          });
        }
      }
    }

    return _items;
  };

  api.findPendingTxRawById = (network, txid) => {
    if (api.electrumCache.pendingTx &&
        api.electrumCache.pendingTx[network] &&
        api.electrumCache.pendingTx[network][txid]) {
      return api.electrumCache.pendingTx[network][txid].rawtx;
    }

    return null;
  };

  api.loadLocalSPVCache = () => {
    if (fs.existsSync(`${api.agamaDir}/spv-cache.json`)) {
      const localCache = fs.readFileSync(`${api.agamaDir}/spv-cache.json`, 'utf8');

      api.log('local spv cache loaded from local file', 'spv.cache');

      try {
        api.electrumCache = JSON.parse(localCache);
      } catch (e) {
        api.log('local spv cache file is damaged, create new', 'spv.cache');
        api.saveLocalSPVCache();
        api.electrumCache = {};
      }
    } else {
      api.log('local spv cache file is not found, create new', 'spv.cache');
      api.saveLocalSPVCache();
      api.electrumCache = {};
    }
  };

  api.saveLocalSPVCache = () => {
    const spvCacheFileName = `${api.agamaDir}/spv-cache.json`;

    _fs.access(api.agamaDir, fs.constants.R_OK, (err) => {
      if (!err) {
        const FixFilePermissions = () => {
          return new Promise((resolve, reject) => {
            const result = 'spv-cache.json file permissions updated to Read/Write';

            fsnode.chmodSync(spvCacheFileName, '0666');

            setTimeout(() => {
              api.log(result, 'spv.cache');
              api.writeLog(result);
              resolve(result);
            }, 1000);
          });
        }

        const FsWrite = () => {
          return new Promise((resolve, reject) => {
            const result = 'spv-cache.json write file is done';

            const err = fs.writeFileSync(spvCacheFileName,
                        JSON.stringify(api.electrumCache)
                        /*.replace(/,/g, ',\n') // format json in human readable form
                        .replace(/":/g, '": ')
                        .replace(/{/g, '{\n')
                        .replace(/}/g, '\n}')*/, 'utf8');

            if (err)
              return api.log(err, 'spv.cache');

            fsnode.chmodSync(spvCacheFileName, '0666');
            setTimeout(() => {
              api.log(result, 'spv.cache');
              api.log(`spv-cache.json file is created successfully at: ${api.agamaDir}`, 'spv.cache');
              resolve(result);
            }, 2000);
          });
        }

        FsWrite()
        .then(FixFilePermissions());
      }
    });
  }

  /*
   *  type: POST
   *
   */
  api.post('/electrum/cache/delete', (req, res, next) => {
    if (api.checkToken(req.body.token)) {
      api.electrumCache = {};
      api.saveLocalSPVCache();

      const retObj = {
        msg: 'success',
        result: 'spv cache is removed',
      };

      res.end(JSON.stringify(retObj));
    } else {
      const retObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(retObj));
    }
  });

  api.getTransaction = (txid, network, ecl) => {
    return new Promise((resolve, reject) => {
      if (!api.electrumCache[network]) {
        api.electrumCache[network] = {};
      }
      if (!api.electrumCache[network].tx) {
        api.electrumCache[network].tx = {};
      }
      if (!api.electrumCache[network].verboseTx) {
        api.electrumCache[network].verboseTx = {};
      }

      const _pendingTxFromCache = api.findPendingTxRawById(network, txid);
      
      if (_pendingTxFromCache) {
        api.log(`${network} ${txid} get from pending txs cache`, 'spv.cache.transaction.pending');
        resolve(_pendingTxFromCache);
      } else {
        api.log(`${network.toUpperCase()} dpow confs spv: ${dpowCoins.indexOf(network.toUpperCase()) > -1 ? true : false}`, 'spv.dpow.confs');
        
        if (!api.electrumCache[network].tx[txid] ||
            !api.electrumCache[network].verboseTx[txid] ||
            (api.electrumCache[network].verboseTx[txid] && api.electrumCache[network].verboseTx[txid].hasOwnProperty('confirmations') && api.electrumCache[network].verboseTx[txid].hasOwnProperty('rawconfirmations') && api.electrumCache[network].verboseTx[txid].confirmations < 2) ||
            (!api.electrumCache[network].verboseTx[txid].hasOwnProperty('confirmations') || !api.electrumCache[network].verboseTx[txid].hasOwnProperty('rawconfirmations'))) {
          api.log(`electrum raw input tx ${txid}`, 'spv.cache');

          if (dpowCoins.indexOf(network.toUpperCase()) > -1) {
            api.log(`${network.toUpperCase()} request dpow data update`, 'spv.dpow.confs');
          }
          
          ecl.blockchainTransactionGet(txid, dpowCoins.indexOf(network.toUpperCase()) > -1 ? true : false)
          .then((_rawtxJSON) => {
            if (_rawtxJSON.hasOwnProperty('hex')) {
              api.electrumCache[network].tx[txid] = _rawtxJSON.hex;
              api.electrumCache[network].verboseTx[txid] = _rawtxJSON;
              delete api.electrumCache[network].verboseTx[txid].hex;
            } else {
              api.electrumCache[network].tx[txid] = _rawtxJSON;
            }
            resolve(api.electrumCache[network].tx[txid]);
          });
        } else {
          api.log(`electrum cached raw input tx ${txid}`, 'spv.cache');
          resolve(api.electrumCache[network].tx[txid]);
        }
      }
    });
  }

  api.getTransactionDecoded = (txid, network, data) => {
    if (!api.electrumCache[network].txDecoded) {
      api.electrumCache[network].txDecoded = {};
    }

    if (api.electrumCache[network].txDecoded[txid]) {
      api.log(`electrum raw input tx decoded ${txid}`, 'spv.cache');
      return api.electrumCache[network].txDecoded[txid];
    } else {
      if (data) {
        api.electrumCache[network].txDecoded[txid] = data;
      } else {
        return false;
      }
    }
  }

  api.getBlockHeader = (height, network, ecl) => {
    return new Promise((resolve, reject) => {
      if (height === 'pending') {
        api.log(`electrum raw block ${height} use current time`, 'spv.cache.pending');
        resolve({
          timestamp: Math.floor(Date.now() / 1000),
        });
      } else {
        if (!api.electrumCache[network]) {
          api.electrumCache[network] = {};
        }
        if (!api.electrumCache[network].blockHeader) {
          api.electrumCache[network].blockHeader = {};
        }

        if (!api.electrumCache[network].blockHeader[height] ||
            !Object.keys(api.electrumCache[network].blockHeader[height]).length) {
          api.log(`electrum raw block ${height}`, 'spv.cache');

          ecl.blockchainBlockGetHeader(height)
          .then((_rawtxJSON) => {
            if (typeof _rawtxJSON === 'string') {            
              _rawtxJSON = parseBlock(_rawtxJSON, btcnetworks[network] || btcnetworks.kmd);

              if (_rawtxJSON.merkleRoot) {
                _rawtxJSON.merkle_root = electrumMerkleRoot(_rawtxJSON);
              }
            }
            api.electrumCache[network].blockHeader[height] = _rawtxJSON;
            // api.log(api.electrumCache[network].blockHeader[height], 'spv.cache');
            resolve(_rawtxJSON);
          });
        } else {
          api.log(`electrum cached raw block ${height}`, 'spv.cache');
          // api.log(api.electrumCache[network].blockHeader[height], 'spv.cache');
          resolve(api.electrumCache[network].blockHeader[height]);
        }
      }
    });
  }

  return api;
};