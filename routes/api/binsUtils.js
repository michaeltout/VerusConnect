const os = require('os');
const fsnode = require('fs');
const _fs = require('graceful-fs');
const exec = require('child_process').exec;

module.exports = (api) => {
  // osx and linux
  api.binFixRights = () => {
    const osPlatform = os.platform();
    const _bins = [
      api.komododBin,
      api.komodocliBin,
      api.veruscliBin
    ];

    if (osPlatform === 'darwin' ||
        osPlatform === 'linux') {
      for (let i = 0; i < _bins.length; i++) {
        _fs.stat(_bins[i], (err, stat) => {
          if (!err) {
            if (parseInt(stat.mode.toString(8), 10) !== 100775) {
              api.log(`${_bins[i]} fix permissions`, 'native.confd');
              fsnode.chmodSync(_bins[i], '0775');
            }
          } else {
            api.log(`error: ${_bins[i]} not found`, 'native.confd');
          }
        });
      }
    }
  }

  api.killRogueProcess = (processName) => {
    // kill rogue process copies on start
    const osPlatform = os.platform();
    let processGrep;

    switch (osPlatform) {
      case 'darwin':
        processGrep = "ps -p $(ps -A | grep -m1 " + processName + " | awk '{print $1}') | grep -i " + processName;
        break;
      case 'linux':
        processGrep = 'ps -p $(pidof ' + processName + ') | grep -i ' + processName;
        break;
      case 'win32':
        processGrep = 'tasklist';
        break;
    }

    exec(processGrep, (error, stdout, stderr) => {
      if (stdout.indexOf(processName) > -1) {
        const pkillCmd = osPlatform === 'win32' ? `taskkill /f /im ${processName}.exe` : `pkill -15 ${processName}`;

        api.log(`found another ${processName} process(es)`, 'native.process');
        api.writeLog(`found another ${processName} process(es)`);

        exec(pkillCmd, (error, stdout, stderr) => {
          api.log(`${pkillCmd} is issued`, 'native.process');
          api.writeLog(`${pkillCmd} is issued`);

          if (error !== null) {
            api.log(`${pkillCmd} exec error: ${error}`, 'native.process');
            api.writeLog(`${pkillCmd} exec error: ${error}`);
          };
        });
      }

      if (error !== null) {
        api.log(`${processGrep} exec error: ${error}`, 'native.process');
        api.writeLog(`${processGrep} exec error: ${error}`);
      };
    });
  }

  return api;
};