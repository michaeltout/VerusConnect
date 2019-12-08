const path = require('path');
const os = require('os');
const fs = require('fs-extra');
const remoteFileSize = require('remote-file-size');

const remoteBinLocation = {
  win32: 'https://artifacts.supernet.org/latest/windows/',
  darwin: 'https://artifacts.supernet.org/latest/osx/',
  linux: 'https://artifacts.supernet.org/latest/linux/',
};
const localBinLocation = {
  win32: 'assets/bin/win64/',
  darwin: 'assets/bin/osx/',
  linux: 'assets/bin/linux64/',
};
const latestBins = {
  win32: [
    'komodo-cli.exe',
    'komodod.exe',
    'libcrypto-1_1.dll',
    'libcurl-4.dll',
    'libcurl.dll',
    'libgcc_s_sjlj-1.dll',
    'libnanomsg.dll',
    'libssl-1_1.dll',
    'libwinpthread-1.dll',
    'nanomsg.dll',
    'pthreadvc2.dll',
  ],
  darwin: [
    'komodo-cli',
    'komodod',
    'libgcc_s.1.dylib',
    'libgomp.1.dylib',
    'libnanomsg.5.0.0.dylib',
    'libstdc++.6.dylib', // encode %2B
  ],
  linux: [
    'komodo-cli',
    'komodod',
  ],
};

let binsToUpdate = [];

module.exports = (api) => {
  /*
   *  Check bins file size
   *  type:
   *  params:
   */
   // TODO: promises
   api.get('/update/bins/check', (req, res, next) => {
    if (api.checkToken(req.query.token)) {
      const rootLocation = path.join(__dirname, '../../');
      const retObj = {
        msg: 'success',
        result: 'bins',
      };

      res.end(JSON.stringify(retObj));

      const _os = os.platform();
      api.log(`checking bins: ${_os}`, 'update.bins');

      api.io.emit('patch', {
        patch: {
          type: 'bins-check',
          status: 'progress',
          message: `checking bins: ${_os}`,
        },
      });
      // get list of bins/dlls that can be updated to the latest
      for (let i = 0; i < latestBins[_os].length; i++) {
        remoteFileSize(remoteBinLocation[_os] + latestBins[_os][i], (err, remoteBinSize) => {
          const localBinSize = fs.statSync(rootLocation + localBinLocation[_os] + latestBins[_os][i]).size;

          api.log('remote url: ' + (remoteBinLocation[_os] + latestBins[_os][i]) + ' (' + remoteBinSize + ')', 'update.bins');
          api.log('local file: ' + (rootLocation + localBinLocation[_os] + latestBins[_os][i]) + ' (' + localBinSize + ')', 'update.bins');

          if (remoteBinSize !== localBinSize) {
            api.log(`${latestBins[_os][i]} can be updated`, 'update.bins');
            binsToUpdate.push({
              name: latestBins[_os][i],
              rSize: remoteBinSize,
              lSize: localBinSize,
            });
          }

          if (i === latestBins[_os].length - 1) {
            api.io.emit('patch', {
              patch: {
                type: 'bins-check',
                status: 'done',
                fileList: binsToUpdate,
              },
            });
          }
        });
      }
    } else {
      const retObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(retObj));
    }
  });

  /*
   *  Update bins
   *  type:
   *  params:
   */
  api.get('/update/bins', (req, res, next) => {
    if (api.checkToken(req.query.token)) {
      const rootLocation = path.join(__dirname, '../../');
      const _os = os.platform();
      const retObj = {
        msg: 'success',
        result: {
          filesCount: binsToUpdate.length,
          list: binsToUpdate,
        },
      };

      res.end(JSON.stringify(retObj));

      for (let i = 0; i < binsToUpdate.length; i++) {
        api.downloadFile({
          remoteFile: remoteBinLocation[_os] + binsToUpdate[i].name,
          localFile: `${rootLocation}${localBinLocation[_os]}patch/${binsToUpdate[i].name}`,
          onProgress: (received, total) => {
            const percentage = (received * 100) / total;

            if (percentage.toString().indexOf('.10') > -1) {
              api.io.emit('patch', {
                msg: {
                  type: 'bins-update',
                  status: 'progress',
                  file: binsToUpdate[i].name,
                  bytesTotal: total,
                  bytesReceived: received,
                },
              });
              // api.log(`${binsToUpdate[i].name} ${percentage}% | ${received} bytes out of ${total} bytes.`);
            }
          }
        })
        .then(() => {
          // verify that remote file is matching to DL'ed file
          const localBinSize = fs.statSync(`${rootLocation}${localBinLocation[_os]}patch/${binsToUpdate[i].name}`).size;
          api.log('compare dl file size');

          if (localBinSize === binsToUpdate[i].rSize) {
            api.io.emit('patch', {
              msg: {
                type: 'bins-update',
                file: binsToUpdate[i].name,
                status: 'done',
              },
            });
            api.log(`file ${binsToUpdate[i].name} succesfully downloaded`, 'update.bins');
          } else {
            api.io.emit('patch', {
              msg: {
                type: 'bins-update',
                file: binsToUpdate[i].name,
                message: 'size mismatch',
              },
            });
            api.log(`error: ${binsToUpdate[i].name} file size doesnt match remote!`, 'update.bins');
          }
        });
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