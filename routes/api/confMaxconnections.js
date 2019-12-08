const fs = require('fs-extra');
const Promise = require('bluebird');

module.exports = (api) => {
  api.getMaxconKMDConf = () => {
    return new Promise((resolve, reject) => {
      fs.readFile(`${api.komodoDir}/komodo.conf`, 'utf8', (err, data) => {
        if (err) {
          api.log('kmd conf maxconnections param read failed', 'native.confd');
          resolve('unset');
        } else {
          const _maxcon = data.match(/maxconnections=\s*(.*)/);

          if (!_maxcon) {
            api.log('kmd conf maxconnections param is unset', 'native.confd');
            resolve(false);
          } else {
            api.log(`kmd conf maxconnections param is already set to ${_maxcon[1]}`, 'native.confd');
            resolve(_maxcon[1]);
          }
        }
      });
    });
  }

  api.setMaxconKMDConf = (limit) => {
    return new Promise((resolve, reject) => {
      fs.readFile(`${api.komodoDir}/komodo.conf`, 'utf8', (err, data) => {
        const _maxconVal = limit ? 1 : 10;

        if (err) {
          api.log(`error reading ${api.komodoDir}/komodo.conf`, 'native.confd');
          resolve(false);
        } else {
          if (data.indexOf('maxconnections=') > -1) {
            const _maxcon = data.match(/maxconnections=\s*(.*)/);

            data = data.replace(`maxconnections=${_maxcon[1]}`, `maxconnections=${_maxconVal}`);
          } else {
            data = `${data}\nmaxconnections=${_maxconVal}\n`;
          }

          fs.writeFile(`${api.komodoDir}/komodo.conf`, data, (err) => {
            if (err) {
              api.log(`error writing ${api.komodoDir}/komodo.conf maxconnections=${_maxconVal}`, 'native.confd');
              resolve(false);
            } else {
              api.log(`kmd conf maxconnections is set to ${_maxconVal}`, 'native.confd');
              resolve(true);
            }
          });
        }
      });
    });
  }

  return api;
};