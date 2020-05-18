const fs = require('fs-extra');
const _fs = require('graceful-fs');
const fsnode = require('fs');
const { ALLOWED_PATHS_ARR } = require('../utils/constants/index')

module.exports = (api) => {
  /**
   * Loads a JSON object from a filepath,
   * and saves it as empty with a description
   * if it doesnt exist
   */
  api.loadJsonFile = (relativePath, description) => {
    if (ALLOWED_PATHS_ARR.includes(relativePath)) {
      const path = `${api.agamaDir}/${relativePath}`

      if (fs.existsSync(path)) {
        let localString = fs.readFileSync(path, 'utf8');
        let localJson
        
        try {
          localJson = JSON.parse(localString);

          if (localJson.data == null || localJson.description == null) {
            api.log(`${path} file detected with deprecated format, saving with description.`, 'loadJsonFile');
            api.writeLog(`${path} file detected with deprecated format, saving with description.`);

            api.saveJsonFile({}, relativePath, description);
          } else {
            localJson = localJson.data
          }
        } catch (e) {
          api.log(`unable to parse local ${path}`, 'loadJsonFile');
          localJson = {};
        }
  
        api.log(`${path} set from local file`, 'loadJsonFile');
        api.writeLog(`${path} set from local file`);
  
        return localJson
      } else {
        api.log(`local ${path} file is not found, saving empty json file.`, 'loadJsonFile');
        api.writeLog(`local ${path} file is not found, saving empty json file.`);
        api.saveJsonFile({}, relativePath, description);
  
        return {};
      }
    } else {
      api.log(`${path} path is not on the approved list of file paths, aborting and returning empty JSON.`, 'loadJsonFile');
      api.writeLog(`${path} path is not on the approved list of file paths, aborting and returning empty JSON.`);

      return {};
    }
  };

  /**
   * Saves JSON object to file, with optional description
   * for those who want to look at the file
   */
  api.saveJsonFile = (
    json,
    relativePath,
    description = "No description for this file was provided by the wallet devs :("
  ) => {
    if (ALLOWED_PATHS_ARR.includes(relativePath)) {
      const path = `${api.agamaDir}/${relativePath}`;

      try {
        try {
          _fs.accessSync(api.agamaDir, fs.constants.R_OK);
        } catch (e) {
          if (e.code == "EACCES") {
            fsnode.chmodSync(path, "0666");
          } else if (e.code === "ENOENT") {
            api.log(`Verus Desktop directory not found`, "saveJsonFile");
          }
        }

        fs.writeFileSync(
          path,
          JSON.stringify({ description, data: json })
            .replace(/,/g, ",\n") // format json in human readable form
            .replace(/":/g, '": ')
            .replace(/{/g, "{\n")
            .replace(/}/g, "\n}"),
          "utf8"
        );

        api.log(
          `json file is created successfully at: ${path}`,
          "saveJsonFile"
        );
        api.writeLog(`json file is created successfully at: ${path}`);
      } catch (e) {
        api.log(`error writing json to ${path}`, "saveJsonFile");
        api.log(e, "saveJsonFile");
      }
    } else {
      api.log(
        `${path} path is not on the approved list of file paths, aborting file save.`,
        "saveJsonFile"
      );
      api.writeLog(
        `${path} path is not on the approved list of file paths, aborting file save.`
      );
    }
  };

  api = require('./currency_data')(api)
  api = require('./nameCommitments')(api)
  return api;
};