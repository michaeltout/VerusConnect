const fs = require('fs-extra');
const _fs = require('graceful-fs');
const fsnode = require('fs');
const Promise = require('bluebird');

module.exports = (api) => {
  api.loadLocalUsers = () => {
    if (fs.existsSync(`${api.agamaDir}/users.json`)) {
      let localUsersJson = fs.readFileSync(`${api.agamaDir}/users.json`, 'utf8');
      let localUsers
      
      try {
        localUsers = JSON.parse(localUsersJson);
      } catch (e) {
        api.log('unable to parse local users.json', 'users');
        localUsers = {};
      }

      api.log('users set from local file', 'users');
      api.writeLog('users set from local file');

      return localUsers
    } else {
      api.log('local users file is not found, saving empty json file.', 'users');
      api.writeLog('local users file is not found, saving empty json file.');
      api.saveLocalUsers({});

      return {};
    }
  };

  api.saveLocalUsers = (users) => {
    const usersFileName = `${api.agamaDir}/users.json`;

    _fs.access(api.agamaDir, fs.constants.R_OK, (err) => {
      if (!err) {
        const FixFilePermissions = () => {
          return new Promise((resolve, reject) => {
            const result = 'user.json file permissions updated to Read/Write';

            fsnode.chmodSync(usersFileName, '0666');

            setTimeout(() => {
              api.log(result, 'users');
              api.writeLog(result);
              resolve(result);
            }, 1000);
          });
        }

        const FsWrite = () => {
          return new Promise((resolve, reject) => {
            const result = 'users.json write file is done';

            fs.writeFile(usersFileName,
                        JSON.stringify(users)
                        .replace(/,/g, ',\n') // format json in human readable form
                        .replace(/":/g, '": ')
                        .replace(/{/g, '{\n')
                        .replace(/}/g, '\n}'), 'utf8', (err) => {
              if (err) {
                return api.log(err);
            } else {
              try {
                fsnode.chmodSync(usersFileName, '0666');
                api.log(result, 'users');
                api.log(`app users.json file is created successfully at: ${api.agamaDir}`, 'users');
                api.writeLog(`app users.json file is created successfully at: ${api.agamaDir}`);
                resolve(result);
              } catch (e) {
                api.log(e)
                resolve("Error changing file permissions while saving.")
              }
            }
            });
          });
        }

        FsWrite()
        .then(FixFilePermissions());
      }
    });
  }

  /*
   *  type: POST
   *  params: userObj
   */
  api.post('/users/save', (req, res, next) => {
    if (api.checkToken(req.body.token)) {
      if (!req.body.userObj) {
        const retObj = {
          msg: 'error',
          result: 'no userObj provided',
        };

        res.end(JSON.stringify(retObj));
      } else {
        api.saveLocalUsers(req.body.userObj);

        const retObj = {
          msg: 'success',
          result: 'users saved',
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

  /*
   *  type: POST
   *  params: none
   */
  api.post('/users/reset', (req, res, next) => {
    if (api.checkToken(req.body.token)) {
      api.saveLocalUsers({});

      const retObj = {
        msg: 'success',
        result: 'users saved',
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

  /*
   *  type: GET
   *
   */
  api.get('/users/load', (req, res, next) => {
    const obj = api.loadLocalUsers();
    res.end(JSON.stringify({
      msg: 'success',
      result: obj,
    }));
  });

  return api;
};