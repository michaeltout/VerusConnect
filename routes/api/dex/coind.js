module.exports = (api) => {
  /*
   *  list native coind
   *  type:
   *  params:
   */
  api.get('/coind/list', (req, res, next) => {
    const successObj = {
      msg: 'success',
      result: api.nativeCoindList,
    };

    res.end(JSON.stringify(successObj));
  });

  api.scanNativeCoindBins = () => {
    let nativeCoindList = {};

    // check if coind bins are present in agama
    for (let key in api.nativeCoind) {
      nativeCoindList[key] = {
        name: api.nativeCoind[key].name,
        port: api.nativeCoind[key].port,
        bin: api.nativeCoind[key].bin,
        bins: {
          daemon: false,
          cli: false,
        },
      };

      if (api.fs.existsSync(`${api.coindRootDir}/${key}/${api.nativeCoind[key].bin}d${api.os.platform() === 'win32' ? '.exe' : ''}`)) {
        nativeCoindList[key].bins.daemon = true;
      }

      if (api.fs.existsSync(`${api.coindRootDir}/${key}/${api.nativeCoind[key].bin}-cli${api.os.platform() === 'win32' ? '.exe' : ''}`)) {
        nativeCoindList[key].bins.cli = true;
      }
    }

    return nativeCoindList;
  }

  return api;
};