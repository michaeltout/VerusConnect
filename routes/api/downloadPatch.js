const path = require('path');
const AdmZip = require('adm-zip');
const remoteFileSize = require('remote-file-size');
const fs = require('fs-extra');
const request = require('request');

module.exports = (api) => {
  /*
   *  DL app patch
   *  type: GET
   *  params: patchList
   */
  //TODO: Re-evauluate as POST or eliminate use of API token

  /*api.get('/update/patch', (req, res, next) => {
    if (api.checkToken(req.query.token)) {
      const retObj = {
        msg: 'success',
        result: 'dl started',
      };

      res.end(JSON.stringify(retObj));

      api.updateAgama();
    } else {
      const retObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(retObj));
    }
  });

  api.updateAgama = () => {
    const rootLocation = path.join(__dirname, '../../');

    api.downloadFile({
      remoteFile: 'https://github.com/pbca26/dl-test/raw/master/patch.zip',
      localFile: `${rootLocation}patch.zip`,
      onProgress: (received, total) => {
        const percentage = (received * 100) / total;

        if (percentage.toString().indexOf('.10') > -1) {
          api.io.emit('patch', {
            msg: {
              status: 'progress',
              type: 'ui',
              progress: percentage,
              bytesTotal: total,
              bytesReceived: received,
            },
          });
          //api.log(`patch ${percentage}% | ${received} bytes out of ${total} bytes.`);
        }
      }
    })
    .then(() => {
      api.remoteFileSize('https://github.com/pbca26/dl-test/raw/master/patch.zip', (err, remotePatchSize) => {
        // verify that remote file is matching to DL'ed file
        const localPatchSize = fs.statSync(`${rootLocation}patch.zip`).size;
        api.log('compare dl file size', 'update.patch');

        if (localPatchSize === remotePatchSize) {
          const zip = new AdmZip(`${rootLocation}patch.zip`);

          api.log('patch succesfully downloaded', 'update.patch');
          api.log('extracting contents', 'update.patch');

          if (api.appConfig.general.main.dev ||
              process.argv.indexOf('devmode') > -1) {
            if (!fs.existsSync(`${rootLocation}/patch`)) {
              fs.mkdirSync(`${rootLocation}/patch`);
            }
          }

          zip.extractAllTo(rootLocation + (api.appConfig.general.main.dev || process.argv.indexOf('devmode') > -1 ? '/patch' : ''), true);
          // TODO: extract files in chunks
          api.io.emit('patch', {
            msg: {
              type: 'ui',
              status: 'done',
            },
          });
          fs.unlinkSync(`${rootLocation}patch.zip`);
        } else {
          api.io.emit('patch', {
            msg: {
              type: 'ui',
              status: 'error',
              message: 'size mismatch',
            },
          });
          api.log('patch file size doesnt match remote!', 'update.patch');
        }
      });
    });
  }*/

  /*
   *  check latest version
   *  type:
   *  params:
   */
  //TODO: Re-evauluate as POST or eliminate use of API token
  /*
  api.get('/update/patch/check', (req, res, next) => {
    if (api.checkToken(req.query.token)) {
      const rootLocation = path.join(__dirname, '../../');
      const options = {
        url: 'https://raw.githubusercontent.com/KomodoPlatform/Agama/pkg_automation_electrum/version',
        method: 'GET',
      };

      request(options, (error, response, body) => {
        if (response &&
            response.statusCode &&
            response.statusCode === 200) {
          const remoteVersion = body.split('\n');
          const localVersionFile = fs.readFileSync(`${rootLocation}version`, 'utf8');
          let localVersion;

          if (localVersionFile.indexOf('\r\n') > -1) {
            localVersion = localVersionFile.split('\r\n');
          } else {
            localVersion = localVersionFile.split('\n');
          }

          if (remoteVersion[0] === localVersion[0]) {
            const retObj = {
              msg: 'success',
              result: 'latest',
            };

            res.end(JSON.stringify(retObj));
          } else {
            const retObj = {
              msg: 'success',
              result: 'update',
              version: {
                local: localVersion[0],
                remote: remoteVersion[0],
              },
            };

            res.end(JSON.stringify(retObj));
          }
        } else {
          const retObj = {
            msg: 'error',
            result: 'error getting update',
          };

          res.end(JSON.stringify(retObj));
        }
      });
    } else {
      const retObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(retObj));
    }
  });*/

  /*
   *  unpack zip
   *  type:
   *  params:
   */
  
  /*
  //TODO: Re-evauluate as POST or eliminate use of API token
  api.get('/unpack', (req, res, next) => {
    if (api.checkToken(req.query.token)) {
      const dlLocation = path.join(__dirname, '../../');
      const zip = new AdmZip(`${dlLocation}patch.zip`);
      zip.extractAllTo(`${dlLocation}/patch/unpack`, true);

      const retObj = {
        msg: 'success',
        result: 'unpack started',
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

  return api;
};