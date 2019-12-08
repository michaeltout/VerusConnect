const fs = require('fs-extra');
const os = require('os');
const { formatBytes } = require('agama-wallet-lib/src/utils');

module.exports = (api) => {
  api.SystemInfo = () => {
    const os_data = {
      totalmem_bytes: os.totalmem(),
      totalmem_readable: formatBytes(os.totalmem()),
      arch: os.arch(),
      cpu: os.cpus()[0].model,
      cpu_cores: os.cpus().length,
      platform: os.platform(),
      os_release: os.release(),
      os_type: os.type(),
    };

    return os_data;
  }

  api.appInfo = () => {
    const sysInfo = api.SystemInfo();
    const releaseInfo = api.appBasicInfo;
    const dirs = {
      agamaDir: api.agamaDir,
      komodoDir: api.komodoDir,
      komododBin: api.komododBin,
      configLocation: `${api.agamaDir}/config.json`,
      cacheLocation: `${api.agamaDir}/spv-cache.json`,
    };
    let spvCacheSize = '2 Bytes';

    try {
      spvCacheSize = formatBytes(fs.lstatSync(`${api.agamaDir}/spv-cache.json`).size);
    } catch (e) {}

    return {
      sysInfo,
      releaseInfo,
      dirs,
      cacheSize: spvCacheSize,
    };
  }

  /*
   *  type: GET
   *
   */
  api.get('/sysinfo', (req, res, next) => {
    if (api.checkToken(req.query.token)) {
      const obj = api.SystemInfo();
      res.send(obj);
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
  api.get('/appinfo', (req, res, next) => {
    if (api.checkToken(req.query.token)) {
      const obj = api.appInfo();
      res.send(obj);
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