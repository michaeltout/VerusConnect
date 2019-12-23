const sha256 = require('js-sha256');
const buggySha256 = require('sha256');
const bip39 = require('bip39');
const bigi = require('bigi');
const bitcoin = require('bitgo-utxo-lib');
const bs58check = require('bs58check');
const wif = require('wif');
const {
  seedToPriv,
  getAddressVersion,
  addressVersionCheck,
} = require('agama-wallet-lib/src/keys');
const networks = require('agama-wallet-lib/src/bitcoinjs-networks');

module.exports = (api) => {
  api.wifToWif = (wif, network) => {
    const _network = api.getNetworkData(network.toLowerCase());
    const key = new bitcoin.ECPair.fromWIF(wif, _network, true);

    return {
      pub: key.getAddress(),
      priv: key.toWIF(),
      pubHex: key.getPublicKeyBuffer().toString('hex'),
      fromWif: api.fromWif(wif, _network),
    };
  }

  // src: https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/src/ecpair.js#L62
  api.fromWif = (string, network, checkVersion) => {
    const decoded = wif.decode(string);
    const version = decoded.version;

    if (!network) throw new Error('Unknown network version');

    if (checkVersion) {
      if (!network) throw new Error('Unknown network version');
      if (network.wifAlt && version !== network.wif && network.wifAlt.indexOf(version) === -1) throw new Error('Invalid network version');
      if (!network.wifAlt && version !== network.wif) throw new Error('Invalid network version');
    }

    const d = bigi.fromBuffer(decoded.privateKey);

    const masterKP = new bitcoin.ECPair(d, null, {
      compressed: !decoded.compressed,
      network,
    });

    if (network.wifAlt) {
      let altKP = [];

      for (let i = 0; i < network.wifAlt.length; i++) {
        let _network = JSON.parse(JSON.stringify(network));
        _network.wif = network.wifAlt[i];

        const _altKP = new bitcoin.ECPair(d, null, {
          compressed: !decoded.compressed,
          network: _network,
        });

        altKP.push({
          pub: _altKP.getAddress(),
          priv: _altKP.toWIF(),
          version: network.wifAlt[i],
        });
      }

      return {
        inputKey: decoded,
        master: {
          pub: masterKP.getAddress(),
          priv: masterKP.toWIF(),
          version: network.wif,
        },
        alt: altKP,
      };
    } else {
      return {
        inputKey: decoded,
        master: {
          pub: masterKP.getAddress(),
          priv: masterKP.toWIF(),
          version: network.wif,
        },
      };
    }
  };

  api.seedToWif = (seed, network, iguana) => {
    let bytes;

    // legacy seed edge case
    if (process.argv.indexOf('spvold=true') > -1) {
      bytes = buggySha256(seed, { asBytes: true });
    } else {
      const hash = sha256.create().update(seed);
      bytes = hash.array();
    }

    if (iguana) {
      bytes[0] &= 248;
      bytes[31] &= 127;
      bytes[31] |= 64;
    }

    const d = bigi.fromBuffer(bytes);
    const _network = network.hasOwnProperty('pubKeyHash') ? network : api.getNetworkData(network.toLowerCase());
    let keyPair = new bitcoin.ECPair(d, null, { network: _network });
    let keys = {
      pub: keyPair.getAddress(),
      priv: keyPair.toWIF(),
      pubHex: keyPair.getPublicKeyBuffer().toString('hex'),
      fromWif: api.fromWif(keyPair.toWIF(), _network),
    };

    let isWif = false;

    try {
      bs58check.decode(seed);
      isWif = true;
    } catch (e) {}

    if (isWif) {
      try {
        keyPair = new bitcoin.ECPair.fromWIF(seed, _network, true);
        keys = {
          priv: keyPair.toWIF(),
          pub: keyPair.getAddress(),
          pubHex: keyPair.getPublicKeyBuffer().toString('hex'),
          fromWif: api.fromWif(keyPair.toWIF(), _network),
        };
      } catch (e) {}
    }

    /*api.log(`seed: ${seed}`, true);
    api.log(`network ${network}`, true);
    api.log(`seedtowif priv key ${keys.priv}`, true);
    api.log(`seedtowif pub key ${keys.pub}`, true);*/

    return keys;
  }

  //TODO: Re-evauluate as POST or eliminate use of API token
  /*
  api.get('/electrum/wiftopub', (req, res, next) => {
    if (api.checkToken(req.query.token)) {
      const _network = api.electrumJSNetworks[req.query.coin.toLowerCase()];
      let key = new bitcoin.ECPair.fromWIF(req.query.wif, _network, true);

      keys = {
        priv: key.toWIF(),
        pub: key.getAddress(),
        pubHex: key.getPublicKeyBuffer().toString('hex'),
        fromWif: api.fromWif(key.toWIF(), _network),
      };

      const retObj = {
        msg: 'success',
        result: {
          keys,
        },
      };

      res.end(JSON.stringify(retObj));
    } else {
      const retObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(retObj));
    }
  });*/

  //TODO: Re-evauluate as POST or eliminate use of API token
  /*
  api.get('/electrum/pubkey/check', (req, res, next) => {
    if (api.checkToken(req.query.token)) {
      const address = api.pubkeyToAddress(req.query.pubkey, req.query.coin);

      if (address) {
        const retObj = {
          msg: 'success',
          result: {
            pubkey: req.query.pubkey,
            address,
          },
        };

        res.end(JSON.stringify(retObj));
      } else {
        const retObj = {
          msg: 'error',
          result: 'wrong pubkey or coin param',
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

  api.pubkeyToAddress = (pubkey, coin) => {
    try {
      const publicKey = new Buffer(pubkey, 'hex');
      const publicKeyHash = bitcoin.crypto.hash160(publicKey);
      const _network = api.electrumJSNetworks[coin];
      const address = bitcoin.address.toBase58Check(publicKeyHash, _network.pubKeyHash);
      api.log(`convert pubkey ${pubkey} -> ${address}`, 'pubkey');
      return address;
    } catch (e) {
      api.log('convert pubkey error: ' + e);
      return false;
    }
  };

  api.post('/electrum/seedtowif', (req, res, next) => {
    if (api.checkToken(req.body.token)) {
      const keys = api.seedToWif(
        req.body.seed,
        req.body.network.toLowerCase(),
        req.body.iguana
      );

      const retObj = {
        msg: 'success',
        result: {
          keys,
        },
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

  //TODO: Re-evauluate as POST or eliminate use of API token
  /*
  api.get('/electrum/seedtowif', (req, res, next) => {
    if (api.checkToken(req.query.token)) {
      const keys = api.seedToWif(
        req.query.seed,
        req.query.network.toLowerCase(),
        req.query.iguana
      );

      const retObj = {
        msg: 'success',
        result: {
          keys,
        },
      };

      res.end(JSON.stringify(retObj));
    } else {
      const retObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(retObj));
    }
  });*/

  api.getCoinByPub = (address, coin) => {
    const _skipNetworks = [
      'btc',
      'crw',
      'dgb',
      'arg',
      'zec',
      'nmc',
      'ltc',
      'vtc',
      'via',
      'fair',
      'doge',
      'kmd',
      'mona',
    ];

    try {
      const _b58check = bitcoin.address.fromBase58Check(address);
      let _coin = [];

      for (let key in api.electrumJSNetworks) {
        if (_b58check.version === api.electrumJSNetworks[key].pubKeyHash &&
            !_skipNetworks.find((item) => { return item === key ? true : false })) {
          _coin.push(key);
        }
      }

      if (_coin.length) {
        return {
          coin: _coin,
          version: _b58check.version,
        };
      } else {
        return 'Unable to find matching coin version';
      }
    } catch (e) {
      return 'Invalid pub address';
    }
  };

  api.get('/electrum/keys/addressversion', (req, res, next) => {
    const retObj = {
      msg: 'success',
      result: getAddressVersion(req.query.address),
    };

    res.end(JSON.stringify(retObj));
  });

  api.get('/electrum/keys/validateaddress', (req, res, next) => {
    const retObj = {
      msg: 'success',
      result: addressVersionCheck(networks[req.query.network.toLowerCase()] || networks.kmd, req.query.address),
    };

    res.end(JSON.stringify(retObj));
  });

  api.post('/electrum/keys', (req, res, next) => {
    if (api.checkToken(req.body.token)) {
      let _matchingKeyPairs = 0;
      let _totalKeys = 0;
      let _electrumKeys = {};
      let _seed = req.body.seed;
      let _wifError = false;

      if (api.seed === _seed) {
        _seed = seedToPriv(_seed, 'btc');

        for (let key in api.electrum.coinData) {
          if (key !== 'auth') {
            let isWif = false;
            let priv;
            let pub;

            try {
              bs58check.decode(_seed);
              isWif = true;
            } catch (e) {}

            const _network = api.getNetworkData(key);

            if (isWif) {
              try {
                const _key = bitcoin.ECPair.fromWIF(_seed, _network, true);
                priv = _key.toWIF();
                pub = _key.getAddress();

                _electrumKeys[key] = {
                  priv,
                  pub,
                };
              } catch (e) {
                _wifError = true;
                break;
              }
            } else {
              const _keys = api.seedToWif(_seed, _network, req.body.iguana);

              _electrumKeys[key] = {
                priv: _keys.priv,
                pub: _keys.pub,
              };
            }
          }
        }

        if (api.eth.wallet &&
            api.eth.wallet.signingKey) {
          for (let key in api.eth.coins) {
            _electrumKeys[key] = {
              pub: api.eth.wallet.signingKey.address,
              priv: api.eth.wallet.signingKey.privateKey,
            };
          }
        }

        const retObj = {
          msg: Object.keys(_electrumKeys).length ? 'success' : 'error',
          result: Object.keys(_electrumKeys).length ? { keys: _electrumKeys, seed: api.seed } : false,
        };

        res.end(JSON.stringify(retObj));
      } else {
        const retObj = {
          msg: 'error',
          result: false,
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

  api.getSpvFees = () => {
    let _fees = {};

    for (let key in api.electrumServers) {
      if (api.electrumServers[key].txfee) {
        _fees[key.toUpperCase()] = api.electrumServers[key].txfee;
      }
    }

    return _fees;
  };

  api.post('/electrum/seed/bip39/match', (req, res, next) => {
    if (api.checkToken(req.body.token)) {
      const seed = bip39.mnemonicToSeed(req.body.seed);
      const hdMaster = bitcoin.HDNode.fromSeedBuffer(seed, api.electrumJSNetworks.kmd);
      const matchPattern = req.body.match;
      const _defaultAddressDepth = req.body.addressdepth;
      const _defaultAccountCount = req.body.accounts;
      let _addresses = [];
      let _matchingKey;

      for (let i = 0; i < _defaultAccountCount; i++) {
        for (let j = 0; j < 1; j++) {
          for (let k = 0; k < _defaultAddressDepth; k++) {
            const _key = hdMaster.derivePath(`m/44'/141'/${i}'/${j}/${k}`);

            if (_key.keyPair.getAddress() === matchPattern) {
              _matchingKey = {
                pub: _key.keyPair.getAddress(),
                priv: _key.keyPair.toWIF(),
              };
            }
          }
        }
      }

      const retObj = {
        msg: 'success',
        result: _matchingKey ? _matchingKey : 'address is not found',
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

  return api;
};
