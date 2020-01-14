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

    try {
      try {
        _fs.accessSync(api.agamaDir, fs.constants.R_OK)
      } catch (e) {
        if (e.code == 'EACCES') {
          fsnode.chmodSync(usersFileName, '0666');
        } else if (e.code === 'ENOENT') {
          api.log('users directory not found', 'users');
        }
      }
     
      fs.writeFileSync(usersFileName,
                  JSON.stringify(users)
                  .replace(/,/g, ',\n') // format json in human readable form
                  .replace(/":/g, '": ')
                  .replace(/{/g, '{\n')
                  .replace(/}/g, '\n}'), 'utf8');

      
      api.log('users.json write file is done', 'users');
      api.log(`app users.json file is created successfully at: ${api.agamaDir}`, 'users');
      api.writeLog(`app users.json file is created successfully at: ${api.agamaDir}`);
    } catch (e) {
      api.log('error writing users', 'users');
      api.log(e, 'users');
    }
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