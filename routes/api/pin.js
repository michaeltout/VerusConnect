const fs = require('fs-extra');
const passwdStrength = require('passwd-strength');
//const bitcoin = require('bitcoinjs-lib');
const bitcoin = require('bitgo-utxo-lib');
const sha256 = require('js-sha256');
const bigi = require('bigi');
const aes256 = require('nodejs-aes256');
const iocane = require('iocane');
const session = iocane.createSession()
  .use('cbc')
  .setDerivationRounds(300000);

const encrypt = session.encrypt.bind(session);
const decrypt = session.decrypt.bind(session);

module.exports = (api) => {
  /*
   *  type: POST
   *  params: none
   */
  api.post('/encryptkey', async (req, res, next) => {
    if (api.checkToken(req.body.token)) {
      const _pin = req.body.key;
      const _str = req.body.string;

      if (_pin &&
          _str) {
        const hash = sha256.create().update(_str);
        let bytes = hash.array();
        bytes[0] &= 248;
        bytes[31] &= 127;
        bytes[31] |= 64;

        const d = bigi.fromBuffer(bytes);
        const keyPair = new bitcoin.ECPair(d, null, { network: api.getNetworkData('btc') });
        const keys = {
          pub: keyPair.getAddress(),
          priv: keyPair.toWIF(),
        };
        const pubkey = req.body.pubkey ? req.body.pubkey : keyPair.getAddress();

        if (passwdStrength(_pin) < 29) {
          api.log('seed storage weak pin!', 'pin');

          const retObj = {
            msg: 'error',
            result: 'seed storage weak pin!',
          };

          res.end(JSON.stringify(retObj));
        } else {
          const _customPinFilenameTest = /^[0-9a-zA-Z-_]+$/g;

          if (_customPinFilenameTest.test(pubkey)) {
            encrypt(req.body.string, _pin)
            .then((encryptedString) => {
              fs.writeFile(`${api.agamaDir}/shepherd/pin/${pubkey}.pin`, encryptedString, (err) => {
                if (err) {
                  api.log('error writing pin file', 'pin');

                  const retObj = {
                    msg: 'error',
                    result: 'error writing pin file',
                  };

                  res.end(JSON.stringify(retObj));
                } else {
                  const retObj = {
                    msg: 'success',
                    result: pubkey,
                  };

                  res.end(JSON.stringify(retObj));
                }
              });
            });
          } else {
            const retObj = {
              msg: 'error',
              result: 'pin file name can only contain alphanumeric characters, dash "-" and underscore "_"',
            };

            res.end(JSON.stringify(retObj));
          }
        }
      } else {
        const _paramsList = [
          'key',
          'string'
        ];
        let retObj = {
          msg: 'error',
          result: '',
        };
        let _errorParamsList = [];

        for (let i = 0; i < _paramsList.length; i++) {
          if (!req.query[_paramsList[i]]) {
            _errorParamsList.push(_paramsList[i]);
          }
        }

        retObj.result = `missing param ${_errorParamsList.join(', ')}`;
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

  api.post('/decryptkey', (req, res, next) => {
    if (api.checkToken(req.body.token)) {
      const _pubkey = req.body.pubkey;
      const _key = req.body.key;

      if (_key &&
          _pubkey) {
        if (fs.existsSync(`${api.agamaDir}/shepherd/pin/${_pubkey}.pin`)) {
          fs.readFile(`${api.agamaDir}/shepherd/pin/${_pubkey}.pin`, 'utf8', async(err, data) => {
            if (err) {
              const retObj = {
                msg: 'error',
                result: err,
              };

              res.end(JSON.stringify(retObj));
            } else {
              const decryptedKey = aes256.decrypt(_key, data);
              const _regexTest = decryptedKey.match(/^[0-9a-zA-Z ]+$/g);

              if (_regexTest) { // re-encrypt with a new method
                encrypt(decryptedKey, _key)
                .then((encryptedString) => {
                  api.log(`seed encrypt old method detected for file ${_pubkey}`, 'pin');

                  fs.writeFile(`${api.agamaDir}/shepherd/pin/${_pubkey}.pin`, encryptedString, (err) => {
                    if (err) {
                      api.log(`Error re-encrypt pin file ${_pubkey}`, 'pin');

                      const retObj = {
                        msg: 'error',
                        result: `Error re-encrypt pin file ${_pubkey}`
                      };

                      res.end(JSON.stringify(retObj));
                    } else {
                      const retObj = {
                        msg: 'success',
                        result: decryptedKey,
                      };

                      res.end(JSON.stringify(retObj));
                    }
                  });
                });
              } else {
                decrypt(data, _key)
                .then((decryptedKey) => {
                  api.log(`pin ${_pubkey} decrypted`, 'pin');

                  const retObj = {
                    msg: 'success',
                    result: decryptedKey,
                  };

                  res.end(JSON.stringify(retObj));
                })
                .catch((err) => {
                  api.log(`pin ${_pubkey} decrypt err ${err}`, 'pin');

                  const retObj = {
                    msg: 'error',
                    result: 'Incorrect password.',
                  };

                  res.end(JSON.stringify(retObj));
                });
              }
            }
          });
        } else {
          const retObj = {
            msg: 'error',
            result: `File ${_pubkey}.pin doesnt exist`,
          };

          res.end(JSON.stringify(retObj));
        }
      } else {
        const retObj = {
          msg: 'error',
          result: 'Missing key or pubkey param',
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

  //TODO: Re-evauluate as POST or eliminate use of API token
  /*
  api.get('/getpinlist', (req, res, next) => {
    if (api.checkToken(req.query.token)) {
      if (fs.existsSync(`${api.agamaDir}/shepherd/pin`)) {
        fs.readdir(`${api.agamaDir}/shepherd/pin`, (err, items) => {
          let _pins = [];

          for (let i = 0; i < items.length; i++) {
            if (items[i].substr(items[i].length - 4, 4) === '.pin') {
              _pins.push(items[i].substr(0, items[i].length - 4));
            }
          }

          if (!items.length) {
            const retObj = {
              msg: 'error',
              result: 'no pins',
            };

            res.end(JSON.stringify(retObj));
          } else {
            const retObj = {
              msg: 'success',
              result: _pins,
            };

            res.end(JSON.stringify(retObj));
          }
        });
      } else {
        const retObj = {
          msg: 'error',
          result: 'pin folder doesn\'t exist',
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
  });*/

  api.post('/modifypin', (req, res, next) => {
    if (api.checkToken(req.body.token)) {
      const pubkey = req.body.pubkey;

      if (pubkey) {
        if (fs.existsSync(`${api.agamaDir}/shepherd/pin/${pubkey}.pin`)) {
          fs.readFile(`${api.agamaDir}/shepherd/pin/${pubkey}.pin`, 'utf8', (err, data) => {
            if (err) {
              const retObj = {
                msg: 'error',
                result: err,
              };

              res.end(JSON.stringify(retObj));
            } else {
              if (req.body.delete) {
                fs.unlinkSync(`${api.agamaDir}/shepherd/pin/${pubkey}.pin`);

                const retObj = {
                  msg: 'success',
                  result: `${pubkey}.pin is removed`,
                };

                res.end(JSON.stringify(retObj));
              } else {
                const pubkeynew = req.body.pubkeynew;
                const _customPinFilenameTest = /^[0-9a-zA-Z-_]+$/g;

                if (pubkeynew) {
                  if (_customPinFilenameTest.test(pubkeynew)) {
                    fs.writeFile(`${api.agamaDir}/shepherd/pin/${pubkeynew}.pin`, data, (err) => {
                      if (err) {
                        api.log('error writing pin file', 'pin');

                        const retObj = {
                          msg: 'error',
                          result: 'error writing pin file',
                        };

                        res.end(JSON.stringify(retObj));
                      } else {
                        fs.unlinkSync(`${api.agamaDir}/shepherd/pin/${pubkey}.pin`);

                        const retObj = {
                          msg: 'success',
                          result: pubkeynew,
                        };

                        res.end(JSON.stringify(retObj));
                      }
                    });
                  } else {
                    const retObj = {
                      msg: 'error',
                      result: 'pin file name can only contain alphanumeric characters, dash "-" and underscore "_"',
                    };

                    res.end(JSON.stringify(retObj));
                  }
                } else {
                  const retObj = {
                    msg: 'error',
                    result: 'missing param pubkeynew',
                  };

                  res.end(JSON.stringify(retObj));
                }
              }
            }
          });
        } else {
          const retObj = {
            msg: 'error',
            result: `file ${pubkey}.pin doesnt exist`,
          };

          res.end(JSON.stringify(retObj));
        }
      } else {
        const retObj = {
          msg: 'error',
          result: 'missing pubkey param',
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