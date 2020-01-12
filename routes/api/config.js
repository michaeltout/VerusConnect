const fs = require('fs-extra');
const _fs = require('graceful-fs');
const fsnode = require('fs');
const Promise = require('bluebird');
const defaultConf = require('../appConfig.js').config;
const {
  deepmerge,
  addMerge,
  flattenObjectProps,
  removeElementByProperties,
  useStringAsKey
} = require("./utils/objectUtil/objectUtil.js");

module.exports = (api) => {
  api.loadLocalConfig = () => {
    const configLocation = `${api.agamaDir}/config.json`

    if (fs.existsSync(configLocation)) {
      try {
        let configChanged = false

        let localAppConfig = JSON.parse(fs.readFileSync(configLocation, 'utf8'))

        api.log('Local app config read successfully, checking diffs...', 'settings');

        const flatLocal = flattenObjectProps(localAppConfig)
        const flatDefault = flattenObjectProps(defaultConf)
        
        const localUnecessary = flatLocal.filter(x => {return !flatDefault.includes(x)})

        if (localUnecessary.length > 0) {
          api.log('The local config has the following unecessary properties, deleting them now...', 'settings');
          api.log(localUnecessary, 'settings');

          localUnecessary.forEach(propertyGroup => {
            if (useStringAsKey(localAppConfig, propertyGroup) != null) {
              const propertyArray = propertyGroup.split('.')
              localAppConfig = removeElementByProperties(localAppConfig, propertyArray)

              api.log(`Removed ${propertyGroup} successfully...`, 'settings');
            }
          })

          configChanged = true
          api.log(`Done removing unecessary properties from local config.`, 'settings');
        }

        const localMissing = flatDefault.filter(x => {return !flatLocal.includes(x)})

        if (localMissing.length > 0) {
          api.log('The local is missing the following properties! Attempting to add them in now...', 'settings');
          api.log(localMissing, 'settings');

          localMissing.forEach(propertyGroup => {
            if (useStringAsKey(localAppConfig, propertyGroup) == null) {
              localAppConfig = addMerge(localAppConfig, defaultConf)

              api.log(`Added ${propertyGroup} successfully...`, 'settings');
            }
          })

          configChanged = true
          api.log(`Done adding missing necessary properties to local config.`, 'settings');
        }

        api.log(`Done checking local config diffs.`, 'settings');

        if (configChanged) {
          api.log(`Diffs found and config updated, saving new config...`, 'settings');
          api.saveLocalAppConf(localAppConfig);
        } else {
          api.log(`No diffs found.`, 'settings');
        }
        
        return localAppConfig

      } catch(e) {
        api.log('Unable to load local config.json, error with following message:', 'settings');
        api.log(e.message, 'settings');
      }
    }

    api.log('Setting config to default...', 'settings');
    api.saveLocalAppConf(defaultConf);
    return defaultConf


    api.log('unable to parse local config.json', 'settings');
    /*if (fs.existsSync(`${api.agamaDir}/config.json`)) {
      let localAppConfig = fs.readFileSync(`${api.agamaDir}/config.json`, 'utf8');

      try {
        JSON.parse(localAppConfig);
      } catch (e) {
        api.log('unable to parse local config.json', 'settings');
        localAppConfig = JSON.stringify(defaultConf);
      }

      api.log('app config set from local file', 'settings');
      api.writeLog('app config set from local file');

      function propertiesToArray(obj) {
        const isObject = val => typeof val === "object" && !Array.isArray(val);

        const addDelimiter = (a, b) => (a ? `${a}.${b}` : b);

        const paths = (obj = {}, head = "") => {
          return Object.entries(obj).reduce((product, [key, value]) => {
            let fullPath = addDelimiter(head, key);
            return isObject(value)
              ? product.concat(paths(value, fullPath))
              : product.concat(fullPath);
          }, []);
        };

        return paths(obj);
      }

      function updateLocalConf(localObj, defaultObj) {
        const flatLocal = propertiesToArray(localObj);
        const flatDefault = propertiesToArray(defaultObj);
        let newLocal = localObj;

        //DELET
        console.log(localObj)

        flatDefault.forEach(propertyList => {
          if (!flatLocal.includes(propertyList)) {
            const propertyArr = propertyList.split(".");
            let updateObj = propertyArr.reduce(function(
              accumulator,
              currentValue
            ) {
              return accumulator[currentValue];
            },
            defaultObj);

            propertyArr
              .slice()
              .reverse()
              .forEach((property, index) => {
                updateObj = { [property]: updateObj };
              });

            newLocal = deepmerge(updateObj, newLocal);
          }
        });

        return newLocal;
      }

      

      if (localAppConfig) {
        let _localAppConfig = JSON.parse(localAppConfig);
        // update config to v2.42 compatible
        if (_localAppConfig.general != null && _localAppConfig.coin != null) {
          const localConf = JSON.parse(localAppConfig)

          //DELET
          console.log("DIFF")
          console.log(propertiesToArray(defaultConf).filter(x => !propertiesToArray(localConf).includes(x)))

          if (JSON.stringify(propertiesToArray(defaultConf)) !== JSON.stringify(propertiesToArray(localConf))) {
            const newConfig = updateLocalConf(localConf, defaultConf)

            api.log("config diff is found, updating local config", "settings");
            api.saveLocalAppConf(newConfig);
            return newConfig;
          } else {
            return localConf
          }
        } 
      }
    } 
    
    api.log('local config file is not found or corrupted!', 'settings');
    api.writeLog('local config file is not found or corrupted!');
    api.saveLocalAppConf(api.appConfig);

    return api.appConfig;*/
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