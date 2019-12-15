const fs = require('fs-extra');
const _fs = require('graceful-fs');
const fsnode = require('fs');
const Promise = require('bluebird');
const defaultConf = require('../appConfig.js').config;
const deepmerge = require('./deepmerge.js');

module.exports = (api) => {
  api.loadLocalConfig = () => {
    if (fs.existsSync(`${api.agamaDir}/config.json`)) {
      let localAppConfig = fs.readFileSync(`${api.agamaDir}/config.json`, 'utf8');

      try {
        JSON.parse(localAppConfig);
      } catch (e) {
        api.log('unable to parse local config.json', 'settings');
        localAppConfig = JSON.stringify(defaultConf);
      }

      api.log('app config set from local file', 'settings');
      api.writeLog('app config set from local file');

      // find diff between local and hardcoded configs
      // append diff to local config
      const compareJSON = (obj1, obj2) => {
        let result = {};

        for (let i in obj1) {
          if (typeof obj1[i] !== 'object') {
            if (!obj2.hasOwnProperty(i)) {
              result[i] = obj1[i];
            }
          } else {
            for (let j in obj1[i]) {
              if (!obj2[i]) {
                obj2[i] = {};
              }

              if (!obj2[i].hasOwnProperty(j)) {
                if (!result[i]) {
                  result[i] = {};
                }

                api.log(`settings multi-level diff ${i} -> ${j}`, 'settings');
                result[i][j] = obj1[i][j];
              }
            }
          }
        }

        return result;
      };

      if (localAppConfig) {
        let _localAppConfig = JSON.parse(localAppConfig);
        // update config to v2.42 compatible
        if (_localAppConfig.general != null && _localAppConfig.coin != null) {
          const compareConfigs = compareJSON(
            defaultConf,
            JSON.parse(localAppConfig)
          );

          if (Object.keys(compareConfigs).length) {
            const newConfig = deepmerge(
              defaultConf,
              JSON.parse(localAppConfig)
            );

            api.log("config diff is found, updating local config", "settings");
            api.log("config diff:", "settings");
            api.log(compareConfigs, "settings");
            api.writeLog("aconfig diff is found, updating local config");
            api.writeLog("config diff:");
            api.writeLog(compareConfigs);

            api.saveLocalAppConf(newConfig);
            return newConfig;
          } else {
            return JSON.parse(localAppConfig);
          }
        } 
      }
    } 
    
    api.log('local config file is not found or corrupted!', 'settings');
    api.writeLog('local config file is not found or corrupted!');
    api.saveLocalAppConf(api.appConfig);

    return api.appConfig;
  };

  api.saveLocalAppConf = (appSettings) => {
    const appConfFileName = `${api.agamaDir}/config.json`;

    _fs.access(api.agamaDir, fs.constants.R_OK, (err) => {
      if (!err) {
        const FixFilePermissions = () => {
          return new Promise((resolve, reject) => {
            const result = 'config.json file permissions updated to Read/Write';

            fsnode.chmodSync(appConfFileName, '0666');

            setTimeout(() => {
              api.log(result, 'settings');
              api.writeLog(result);
              resolve(result);
            }, 1000);
          });
        }

        const FsWrite = () => {
          return new Promise((resolve, reject) => {
            const result = 'config.json write file is done';

            fs.writeFile(appConfFileName, JSON.stringify({}), "utf8", err => {
              if (err) return api.log(err);
            });

            fsnode.chmodSync(appConfFileName, '0666');

            fs.writeFile(
              appConfFileName,
              JSON.stringify(appSettings)
                .replace(/,/g, ",\n") // format json in human readable form
                .replace(/":/g, '": ')
                .replace(/{/g, "{\n")
                .replace(/}/g, "\n}"),
              "utf8",
              err => {
                if (err) return api.log(err);
              }
            );

            setTimeout(() => {
              api.log(result, 'settings');
              api.log(`app conf.json file is created successfully at: ${api.agamaDir}`, 'settings');
              api.writeLog(`app conf.json file is created successfully at: ${api.agamaDir}`);
              resolve(result);
            }, 2000);
          });
        }

        FsWrite()
        .then(FixFilePermissions());
      }
    });
  }

  /*
   *  type: POST
   *  params: configObj
   */
  api.post('/config/save', (req, res, next) => {
    if (api.checkToken(req.body.token)) {
      if (!req.body.configObj) {
        const retObj = {
          msg: 'error',
          result: 'no configObj provided',
        };

        res.end(JSON.stringify(retObj));
      } else {
        api.saveLocalAppConf(req.body.configObj);

        const retObj = {
          msg: 'success',
          result: 'config saved',
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
  api.post('config/reset', (req, res, next) => {
    if (api.checkToken(req.body.token)) {
      api.saveLocalAppConf(api.defaultAppConfig);

      const retObj = {
        msg: 'success',
        result: 'config saved',
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
  api.get('/config/load', (req, res, next) => {
    const retObj = {
      msg: 'success',
      result: api.loadLocalConfig(),
    };

    res.send(retObj);
  });

  /*
   *  type: GET
   *
   */
  api.get('/config/schema', (req, res, next) => {
    const retObj = {
      msg: 'success',
      result: api.appConfigSchema,
    };

    res.send(retObj);
  });

  api.testLocation = (path) => {
    return new Promise((resolve, reject) => {
      fs.lstat(path, (err, stats) => {
        if (err) {
          api.log(`error testing path ${path}`, 'settings');
          resolve(-1);
        } else {
          if (stats.isDirectory()) {
            resolve(true);
          } else {
            api.log(`error testing path ${path} not a folder`, 'settings');
            resolve(false);
          }
        }
      });
    });
  }

  return api;
};