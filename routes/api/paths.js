const {
  pathsAgama,
  pathsDaemons,
  customPathsDaemons
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

  api.customPathsDaemons = (daemonName) => {
    api = customPathsDaemons(api, daemonName);
  }

  return api;
};