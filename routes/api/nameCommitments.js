const fs = require('fs-extra');
const _fs = require('graceful-fs');
const fsnode = require('fs');
const Promise = require('bluebird');

module.exports = (api) => {
  api.loadLocalCommitments = () => {
    if (fs.existsSync(`${api.agamaDir}/nameCommits.json`)) {
      let localCommitsJson = fs.readFileSync(`${api.agamaDir}/nameCommits.json`, 'utf8');
      let localCommits
      
      try {
        localCommits = JSON.parse(localCommitsJson);
      } catch (e) {
        api.log('unable to parse local nameCommits.json', 'commitments');
        localCommits = {};
      }

      api.log('commitments set from local file', 'commitments');
      api.writeLog('commitments set from local file');

      return localCommits
    } else {
      api.log('local commitments file is not found, saving empty json file.', 'commitments');
      api.writeLog('local commitments file is not found, saving empty json file.');
      api.saveLocalCommitments({});

      return {};
    }
  };

  api.saveLocalCommitments = (commitments) => {
    const commitsFileName = `${api.agamaDir}/nameCommits.json`;

    try {
      try {
        _fs.accessSync(api.agamaDir, fs.constants.R_OK)
      } catch (e) {
        if (e.code == 'EACCES') {
          fsnode.chmodSync(commitsFileName, '0666');
        } else if (e.code === 'ENOENT') {
          api.log('name commitments directory not found', 'nameCommits');
        }
      }
     
      fs.writeFileSync(commitsFileName,
                  JSON.stringify(commitments)
                  .replace(/,/g, ',\n') // format json in human readable form
                  .replace(/":/g, '": ')
                  .replace(/{/g, '{\n')
                  .replace(/}/g, '\n}'), 'utf8');

      
      api.log('nameCommits.json write file is done', 'nameCommits');
      api.log(`app nameCommits.json file is created successfully at: ${api.agamaDir}`, 'nameCommits');
      api.writeLog(`nameCommits.json file is created successfully at: ${api.agamaDir}`);
    } catch (e) {
      api.log('error writing name commitments', 'nameCommits');
      api.log(e, 'nameCommits');
    }
  }

  return api;
};