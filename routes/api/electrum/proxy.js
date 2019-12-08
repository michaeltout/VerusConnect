const request = require('request');
const Promise = require('bluebird');
const { getRandomIntInclusive } = require('agama-wallet-lib/src/utils');
const { proxyServersHttps } = require('agama-wallet-lib/src/electrum-servers');

// TODO: reduce code
// abstraction layer to communicate with electrum proxies

// pick a random proxy server
const proxyServer = proxyServersHttps[getRandomIntInclusive(0, proxyServersHttps.length - 1)];

console.log(`proxy server ${proxyServer}`);

module.exports = (api) => {
  /*api.httpReq = (url, type) => {

  };*/
  api.proxyActiveCoin = {};

  api.proxy = (network) => {
    api.log('proxy =>', 'spv.proxy');
    api.log(network, 'spv.proxy');

    if (network) {
      api.proxyActiveCoin = network;
    }

    const _electrumServer = {
      port: api.electrum.coinData[network].server.port || api.electrumServers[network].port,
      ip: api.electrum.coinData[network].server.ip || api.electrumServers[network].address,
      proto: api.electrum.coinData[network].server.proto || api.electrumServers[network].proto,
    };

    const makeUrl = (arr) => {
      let _url = [];

      for (let key in _electrumServer) {
        _url.push(`${key}=${_electrumServer[key]}`);
      }

      for (let key in arr) {
        _url.push(`${key}=${arr[key]}`);
      }

      return _url.join('&');
    };

    return {
      connect: () => {
        api.log('proxy fake connect', 'spv.proxy.conn');
      },
      close: () => {
        api.log('proxy fake close', 'spv.proxy.closeConn');
      },
      blockchainAddressGetBalance: (address) => {
        api.log(`proxy blockchainAddressGetBalance ${address}`, 'spv.proxy.getbalance');

        return new Promise((resolve, reject) => {
          const options = {
            url: `https://${proxyServer}/api/getbalance?${makeUrl({ address })}`,
            method: 'GET',
          };

          request(options, (error, response, body) => {
            if (response &&
                response.statusCode &&
                response.statusCode === 200) {
              try {
                const _parsedBody = JSON.parse(body);
                api.log('proxy blockchainAddressGetBalance parsed', 'spv.proxy.getbalance');
                api.log(_parsedBody, 'spv.proxy.getbalance');

                if (_parsedBody) {
                  resolve(_parsedBody.result);
                }
                api.log(`proxy blockchainAddressGetBalance ${address}`, 'spv.proxy.getbalance');
              } catch (e) {
                api.log(`parse error proxy blockchainAddressGetBalance ${address}`, 'spv.proxy.getbalance');
              }
            } else {
              api.log(`req error proxy blockchainAddressGetBalance ${address}`, 'spv.proxy.getbalance');
            }
          });
        });
      },
      blockchainAddressListunspent: (address) => {
        api.log(`proxy blockchainAddressListunspent ${address}`, 'spv.proxy.getbalance');

        return new Promise((resolve, reject) => {
          const options = {
            url: `https://${proxyServer}/api/listunspent?${makeUrl({ address })}`,
            method: 'GET',
          };

          request(options, (error, response, body) => {
            if (response &&
                response.statusCode &&
                response.statusCode === 200) {
              try {
                const _parsedBody = JSON.parse(body);
                api.log('proxy blockchainAddressListunspent parsed', 'spv.proxy.getbalance');
                api.log(_parsedBody, 'spv.proxy.getbalance');

                if (_parsedBody) {
                  resolve(_parsedBody.result);
                }
                api.log(`proxy blockchainAddressListunspent ${address}`, 'spv.proxy.getbalance');
              } catch (e) {
                api.log(`parse error proxy blockchainAddressListunspent ${address}`, 'spv.proxy.getbalance');
              }
            } else {
              api.log(`req error proxy blockchainAddressListunspent ${address}`, 'spv.proxy.getbalance');
            }
          });
        });
      },
      blockchainAddressGetHistory: (address) => {
        api.log(`proxy blockchainAddressGetHistory ${address}`, 'spv.proxy.listtransactions');

        return new Promise((resolve, reject) => {
          const options = {
            url: `https://${proxyServer}/api/listtransactions?${makeUrl({ address })}`,
            method: 'GET',
          };

          request(options, (error, response, body) => {
            if (response &&
                response.statusCode &&
                response.statusCode === 200) {
              try {
                const _parsedBody = JSON.parse(body);
                api.log('proxy blockchainAddressGetHistory parsed', 'spv.proxy.listtransactions');
                api.log(_parsedBody, 'spv.proxy.listtransactions');

                if (_parsedBody) {
                  resolve(_parsedBody.result);
                }
                api.log(`proxy blockchainAddressGetHistory ${address}`, 'spv.proxy.listtransactions');
              } catch (e) {
                api.log(`parse error proxy blockchainAddressGetHistory ${address}`, 'spv.proxy.listtransactions');
              }
            } else {
              api.log(`req error proxy blockchainAddressGetHistory ${address}`, 'spv.proxy.listtransactions');
            }
          });
        });
      },
      blockchainEstimatefee: (blocks) => {
        api.log(`proxy blockchainEstimatefee ${blocks}`, 'spv.proxy.estimatefee');

        return new Promise((resolve, reject) => {
          const options = {
            url: `https://${proxyServer}/api/estimatefee?${makeUrl({ blocks })}`,
            method: 'GET',
          };

          request(options, (error, response, body) => {
            if (response &&
                response.statusCode &&
                response.statusCode === 200) {
              try {
                const _parsedBody = JSON.parse(body);
                api.log('proxy blockchainEstimatefee parsed', 'spv.proxy.estimatefee');
                api.log(_parsedBody, 'spv.proxy.estimatefee');

                if (_parsedBody) {
                  resolve(_parsedBody.result);
                }
                api.log(`proxy blockchainEstimatefee ${address}`, 'spv.proxy.estimatefee');
              } catch (e) {
                api.log(`parse error proxy blockchainEstimatefee ${address}`, 'spv.proxy.estimatefee');
              }
            } else {
              api.log(`req error proxy blockchainEstimatefee ${address}`, 'spv.proxy.estimatefee');
            }
          });
        });
      },
      blockchainBlockGetHeader: (height) => {
        api.log(`proxy blockchainBlockGetHeader ${height}`, 'spv.proxy.getheader');

        return new Promise((resolve, reject) => {
          const options = {
            url: `https://${proxyServer}/api/getblockinfo?${makeUrl({ height })}`,
            method: 'GET',
          };

          request(options, (error, response, body) => {
            if (response &&
                response.statusCode &&
                response.statusCode === 200) {
              try {
                const _parsedBody = JSON.parse(body);
                api.log('proxy blockchainBlockGetHeader parsed', 'spv.proxy.getheader');
                api.log(_parsedBody, 'spv.proxy.getheader');

                if (_parsedBody) {
                  resolve(_parsedBody.result);
                }
                api.log(`proxy blockchainBlockGetHeader ${height}`, 'spv.proxy.getheader');
              } catch (e) {
                api.log(`parse error proxy blockchainBlockGetHeader ${height}`, 'spv.proxy.getheader');
              }
            } else {
              api.log(`req error proxy blockchainBlockGetHeader ${height}`, 'spv.proxy.getheader');
            }
          });
        });
      },
      blockchainHeadersSubscribe: () => {
        api.log('proxy blockchainHeadersSubscribe', 'spv.proxy.getcurrentblock');

        return new Promise((resolve, reject) => {
          const options = {
            url: `https://${proxyServer}/api/getcurrentblock?${makeUrl()}`,
            method: 'GET',
          };

          request(options, (error, response, body) => {
            if (response &&
                response.statusCode &&
                response.statusCode === 200) {
              try {
                const _parsedBody = JSON.parse(body);
                api.log('proxy blockchainHeadersSubscribe parsed', 'spv.proxy.getcurrentblock');
                api.log(_parsedBody, 'spv.proxy.getcurrentblock');

                if (_parsedBody) {
                  resolve(_parsedBody.result);
                }
                api.log('proxy blockchainHeadersSubscribe', 'spv.proxy.getcurrentblock');
              } catch (e) {
                api.log('parse error proxy blockchainHeadersSubscribe', 'spv.proxy.getcurrentblock');
              }
            } else {
              api.log('req error proxy blockchainHeadersSubscribe', 'spv.proxy.getcurrentblock');
            }
          });
        });
      },
      blockchainTransactionGet: (txid) => {
        api.log(`proxy blockchainTransactionGet ${txid}`, 'spv.proxy.gettransaction');

        return new Promise((resolve, reject) => {
          const options = {
            url: `https://${proxyServer}/api/gettransaction?${makeUrl({ txid })}`,
            method: 'GET',
          };

          request(options, (error, response, body) => {
            if (response &&
                response.statusCode &&
                response.statusCode === 200) {
              try {
                const _parsedBody = JSON.parse(body);
                api.log('proxy blockchainTransactionGet parsed', 'spv.proxy.gettransaction');
                api.log(_parsedBody, 'spv.proxy.gettransaction');

                if (_parsedBody) {
                  resolve(_parsedBody.result);
                }
                api.log(`proxy blockchainTransactionGet ${txid}`, 'spv.proxy,.gettransaction');
              } catch (e) {
                api.log(`parse error proxy blockchainTransactionGet ${txid}`, 'spv.proxy.gettransaction');
              }
            } else {
              api.log(`req error proxy blockchainTransactionGet ${txid}`, 'spv.proxy.gettransaction');
            }
          });
        });
      },
      blockchainTransactionGetMerkle: (txid, height) => {
        api.log(`proxy blockchainTransactionGetMerkle ${txid} ${height}`, 'spv.proxy.merke');

        return new Promise((resolve, reject) => {
          const options = {
            url: `https://${proxyServer}/api/getmerkle?${makeUrl({ txid, height })}`,
            method: 'GET',
          };

          request(options, (error, response, body) => {
            if (response &&
                response.statusCode &&
                response.statusCode === 200) {
              try {
                const _parsedBody = JSON.parse(body);
                api.log('proxy blockchainTransactionGetMerkle parsed', 'spv.proxy.merke');
                api.log(_parsedBody, 'spv.proxy.merke');

                if (_parsedBody) {
                  resolve(_parsedBody.result);
                }
                api.log(`proxy blockchainTransactionGetMerkle ${txid} ${height}`, 'spv.proxy.merke');
              } catch (e) {
                api.log(`parse error proxy blockchainTransactionGetMerkle ${txid} ${height}`, 'spv.proxy.merke');
              }
            } else {
              api.log(`req error proxy blockchainTransactionGetMerkle ${txid} ${height}`, 'spv.proxy.merke');
            }
          });
        });
      },
      serverVersion: () => {
        api.log('proxy serverVersion', 'spv.proxy.server');

        return new Promise((resolve, reject) => {
          const options = {
            url: `https://${proxyServer}/api/gettransaction?${makeUrl()}`,
            method: 'GET',
          };

          request(options, (error, response, body) => {
            if (response &&
                response.statusCode &&
                response.statusCode === 200) {
              try {
                const _parsedBody = JSON.parse(body);
                api.log('proxy serverVersion parsed', 'spv.proxy.server');
                api.log(_parsedBody, 'spv.proxy.server');

                if (_parsedBody) {
                  resolve(_parsedBody.result);
                }
                api.log('proxy serverVersion', 'spv.proxy.server');
              } catch (e) {
                api.log('parse error proxy serverVersion', 'spv.proxy.server');
              }
            } else {
              api.log('req error proxy serverVersion', 'spv.proxy.server');
            }
          });
        });
      },
      blockchainTransactionBroadcast: (rawtx) => {
        api.log(`proxy blockchainTransactionBroadcast ${rawtx}`, 'spv.proxy.pushtx');

        return new Promise((resolve, reject) => {
          const options = {
            url: `https://${proxyServer}/api/pushtx`,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              port: _electrumServer.port,
              ip: _electrumServer.ip,
              proto: _electrumServer.proto,
              rawtx,
            }),
          };

          request(options, (error, response, body) => {
            if (response &&
                response.statusCode &&
                response.statusCode === 200) {
              try {
                const _parsedBody = JSON.parse(body);
                api.log('proxy blockchainTransactionBroadcast parsed', 'spv.proxy.pushtx');
                api.log(_parsedBody, 'spv.proxy.pushtx');

                if (_parsedBody) {
                  resolve(_parsedBody.result);
                }
                api.log('proxy blockchainTransactionBroadcast', 'spv.proxy.pushtx');
              } catch (e) {
                api.log('parse error proxy blockchainTransactionBroadcast', 'spv.proxy.pushtx');
              }
            } else {
              api.log('req error proxy blockchainTransactionBroadcast', 'spv.proxy.pushtx');
            }
          });
        });
      },
    };
  };

  return api;
}