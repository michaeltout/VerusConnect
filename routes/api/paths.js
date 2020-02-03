const {
  pathsAgama,
  pathsDaemons,
  setDaemonPath,
  setCoinDir
} = require('./pathsUtil');
const path = require('path');
const fixPath = require('fix-path');
const os = require('os');

module.exports = (api) => {
  api.pathsAgama = () => {
    api = pathsAgama(api);
  }

  api.pathsDaemons = () => {
    api = pathsDaemons(api);
  }

  api.setDaemonPath = (daemonName) => {
    api = setDaemonPath(api, daemonName);
  }

  api.setCoinDir = (coin, dirNames) => {
    api = setCoinDir(api, coin, dirNames)
  }

  return api;
};