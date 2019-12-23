const Promise = require('bluebird');
const reverse = require('buffer-reverse');
const crypto = require('crypto');
const _sha256 = (data) => {
  return crypto.createHash('sha256').update(data).digest();
};
const { getRandomIntInclusive } = require('agama-wallet-lib/src/utils');

module.exports = (api) => {
  // get merkle root
  api.getMerkleRoot = (txid, proof, pos) => {
    let hash = txid;
    let serialized;

    api.log(`getMerkleRoot txid ${txid}`, 'spv.merkle');
    api.log(`getMerkleRoot pos ${pos}`, 'spv.merkle');
    api.log('getMerkleRoot proof', 'spv.merkle');
    api.log(`getMerkleRoot ${proof}`, 'spv.merkle');

    for (i = 0; i < proof.length; i++) {
      const _hashBuff = new Buffer(hash, 'hex');
      const _proofBuff = new Buffer(proof[i], 'hex');

      if ((pos & 1) == 0) {
        serialized = Buffer.concat([
          reverse(_hashBuff),
          reverse(_proofBuff)
        ]);
      } else {
        serialized = Buffer.concat([
          reverse(_proofBuff),
          reverse(_hashBuff)
        ]);
      }

      hash = reverse(_sha256(_sha256(serialized))).toString('hex');
      pos /= 2;
    }

    return hash;
  }

  api.verifyMerkle = (txid, height, serverList, mainServer, network) => {
    // select random server
    return new Promise((resolve, reject) => {
      async function _verifyMerkle() {
        if (serverList.length === 0) {
          resolve(false);
        } else {
          const _rnd = getRandomIntInclusive(0, serverList.length - 1);
          const randomServer = serverList[_rnd];
          const _randomServer = randomServer.split(':');
          const _mainServer = mainServer.split(':');

          let ecl = await api.ecl(network, {
            ip: _mainServer[0],
            port: _mainServer[1],
            proto: _mainServer[2],
          });

          api.log(`main server: ${mainServer}`, 'spv.merkle');
          api.log(`verification server: ${randomServer}`, 'spv.merkle');

          ecl.connect();
          ecl.blockchainTransactionGetMerkle(txid, height)
          .then((merkleData) => {
            ecl.close();

            async function __verifyMerkle() {
              if (merkleData &&
                  merkleData.merkle &&
                  merkleData.pos) {
                api.log('electrum getmerkle =>', 'spv.merkle');
                api.log(merkleData, 'spv.merkle');

                const _res = api.getMerkleRoot(
                  txid,
                  merkleData.merkle,
                  merkleData.pos
                );
                api.log(_res, 'spv.merkle');

                ecl = await api.ecl(network, {
                  ip: _randomServer[0],
                  port: _randomServer[1],
                  proto: _randomServer[2],
                });
                ecl.connect();

                api.getBlockHeader(height, network, ecl)
                .then((blockInfo) => {
                  ecl.close();

                  if (JSON.stringify(blockInfo).indexOf('error') > -1) {
                    resolve(false);
                  } else {
                    if (blockInfo &&
                        blockInfo.merkle_root) {
                      api.log('blockinfo =>', 'spv.merkle');
                      api.log(blockInfo, 'spv.merkle');
                      api.log(blockInfo.merkle_root, 'spv.merkle');

                      if (blockInfo &&
                          blockInfo.merkle_root) {
                        if (_res === blockInfo.merkle_root) {
                          resolve(true);
                        } else {
                          resolve(false);
                        }
                      } else {
                        resolve(api.CONNECTION_ERROR_OR_INCOMPLETE_DATA);
                      }
                    } else {
                      resolve(api.CONNECTION_ERROR_OR_INCOMPLETE_DATA);
                    }
                  }
                });
              } else {
                ecl.close();
                resolve(api.CONNECTION_ERROR_OR_INCOMPLETE_DATA);
              }
            };
            __verifyMerkle();
          });
        }
      };
      _verifyMerkle();
    });
  }

  api.verifyMerkleByCoin = (coin, txid, height) => {
    const _serverList = api.electrum.coinData[coin] ? api.electrum.coinData[coin].serverList : api.electrumServers[coin].serverList;
    let _server = api.electrum.coinData[coin] ? api.electrum.coinData[coin].server : api.electrumServers[coin].serverList[0];

    if (typeof _server === 'string') {
      const __server = _server.split(':');
      _server = {
        ip: __server[0],
        port: __server[1],
        proto: __server[2],
      };
    }

    api.log('verifyMerkleByCoin', 'spv.merkle');
    api.log(_server, 'spv.merkle');
    api.log(_serverList, 'spv.merkle');

    return new Promise((resolve, reject) => {
      if (_serverList !== 'none') {
        let _filteredServerList = [];

        for (let i = 0; i < _serverList.length; i++) {
          if (_serverList[i] !== `${_server.ip}:${_server.port}:${_server.proto}`) {
            _filteredServerList.push(_serverList[i]);
          }
        }

        api.verifyMerkle(
          txid,
          height,
          _filteredServerList,
          `${_server.ip}:${_server.port}:${(api.electrum.coinData[coin] && api.electrum.coinData[coin].server.proto || 'tcp')}`,
          coin
        )
        .then((proof) => {
          resolve(proof);
        });
      } else {
        resolve(false);
      }
    });
  }

  //TODO: Re-evauluate as POST or eliminate use of API token
  /*
  api.get('/electrum/merkle/verify', (req, res, next) => {
    if (api.checkToken(req.query.token)) {
      const _coin = req.query.coin;
      const _txid = req.query.txid;
      const _height = req.query.height;

      api.verifyMerkleByCoin(_coin, _txid, _height)
      .then((verifyMerkleRes) => {
        const retObj = {
          msg: 'success',
          result: {
            merkleProof: verifyMerkleRes,
          },
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
  });*/

  return api;
};