const { NAME_COMMITMENTS, NAME_COMMITMENTS_DESC } = require('../utils/constants/index')

module.exports = (api) => {
  api.loadLocalCommitments = () =>
    api.loadJsonFile(NAME_COMMITMENTS, NAME_COMMITMENTS_DESC);
  api.saveLocalCommitments = (commitments) =>
    api.saveJsonFile(commitments, NAME_COMMITMENTS, NAME_COMMITMENTS_DESC);

  return api;
};