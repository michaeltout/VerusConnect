const fs = require('fs-extra');
const _fs = require('graceful-fs');
const wif = require('wif');
//const bitcoinJS = require('bitcoinjs-lib');
const bitcoinJS = require('bitgo-utxo-lib');

module.exports = (api) => {
  /*
   *  type: GET
   *
   */
  api.get('/coindwalletkeys', (req, res, next) => {
    if (api.checkToken(req.query.token)) {
      const chain = req.query.chain;

      // ref: https://gist.github.com/kendricktan/1e62495150ad236b38616d733aac4eb9
      let _walletDatLocation = chain === 'komodo' || chain === 'KMD' || chain === 'null' ? `${api.komodoDir}/wallet.dat` : `${api.komodoDir}/${chain}/wallet.dat`;
      _walletDatLocation = chain === 'CHIPS' ? `${api.chipsDir}/wallet.dat` : _walletDatLocation;

      try {
        _fs.access(_walletDatLocation, fs.constants.R_OK, (err) => {
          if (err) {
            api.log(`error reading ${_walletDatLocation}`, 'native.wallet.dat');
            retObj = {
              msg: 'error',
              result: `error reading ${_walletDatLocation}`,
            };

            res.end(JSON.stringify(retObj));
          } else {
            api.log(`reading ${_walletDatLocation}`);
            fs.readFile(_walletDatLocation, (err, data) => {
              if (err) {
                api.log(`read wallet.dat err: ${err}`, 'native.wallet.dat');
                retObj = {
                  msg: 'error',
                  result: `error reading ${_walletDatLocation}`,
                };

                res.end(JSON.stringify(retObj));
              } else {
                const re = /\x30\x81\xD3\x02\x01\x01\x04\x20(.{32})/gm;
                const dataHexStr = data.toString('latin1');
                privateKeys = dataHexStr.match(re);

                if (!privateKeys) {
                  api.log('wallet is encrypted?', 'native.wallet.dat');

                  retObj = {
                    msg: 'error',
                    result: 'wallet is encrypted?',
                  };

                  res.end(JSON.stringify(retObj));
                } else {
                  let _keys = [];
                  privateKeys = privateKeys.map(x => x.replace('\x30\x81\xD3\x02\x01\x01\x04\x20', ''));
                  privateKeys = privateKeys.filter((v, i, a) => a.indexOf(v) === i);
                  api.log(`found ${privateKeys.length} keys`, 'native.wallet.dat');

                  for (let i = 0; i < privateKeys.length; i++) {
                    const privateKey = new Buffer(Buffer.from(privateKeys[i], 'latin1').toString('hex'), 'hex');
                    const key = wif.encode(
                      0xbc,
                      privateKey,
                      true
                    );
                    const keyObj = wif.decode(key);
                    const wifKey = wif.encode(keyObj);

                    const keyPair = bitcoinJS.ECPair.fromWIF(
                      wifKey,
                      api.electrumJSNetworks.kmd
                    );
                    const _keyPair = {
                      priv: keyPair.toWIF(),
                      pub: keyPair.getAddress(),
                    };

                    if (req.query.search) {
                      if (_keyPair.pub.indexOf(req.query.search) > -1) {
                        _keys.push(_keyPair);
                      }
                    } else {
                      _keys.push(_keyPair);
                    }
                  }

                  retObj = {
                    msg: 'success',
                    result: _keys,
                  };

                  res.end(JSON.stringify(retObj));
                }
              }
            });
          }
        });
      } catch (e) {
        retObj = {
          msg: 'error',
          result: `error reading ${_walletDatLocation}`,
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

  return api;
};
