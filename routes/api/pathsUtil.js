const path = require('path');
const fixPath = require('fix-path');
const os = require('os');

const pathsAgama = (api) => {
  if (!api) api = {};

  switch (os.platform()) {
    case 'darwin':
      fixPath();
      //api.agamaDirKMD = `${process.env.HOME}/Library/Application Support/Agama`;

      api.agamaDir = `${process.env.HOME}/Library/Application Support/Verus-Desktop`;
      return api;
      break;

    case 'linux':
      //api.agamaDirKMD = `${process.env.HOME}/.agama`;

      api.agamaDir = `${process.env.HOME}/.verus-desktop`;
      return api;
      break;

    case 'win32':
      //api.agamaDirKMD = `${process.env.APPDATA}/Agama`;
      //api.agamaDirKMD = path.normalize(api.agamaDirKMD);

      api.agamaDir = `${process.env.APPDATA}/Verus-Desktop`;
      api.agamaDir = path.normalize(api.agamaDir);
      return api;
      break;
  }
};

const pathsDaemons = (api) => {
  if (!api) api = {};

  switch (os.platform()) {
    case 'darwin':
      fixPath();
      api.agamaTestDir = `${process.env.HOME}/Library/Application Support/Verus/test`,
      api.komododBin = path.join(__dirname, '../../assets/bin/osx/komodod'),
      api.komodocliBin = path.join(__dirname, '../../assets/bin/osx/komodo-cli'),
      api.veruscliBin = path.join(__dirname, '../../assets/bin/osx/verusd/verus'),
      api.komodocliDir = path.join(__dirname, '../../assets/bin/osx'),
      api.komodoDir = `${process.env.HOME}/Library/Application Support/Komodo`,
      api.vrscDir = `${process.env.HOME}/Library/Application Support/Komodo/VRSC`,
      api.verusDir = `${process.env.HOME}/Library/Application Support/Verus`,
      api.verusTestDir = `${process.env.HOME}/Library/Application Support/VerusTest`,
      api.zcashdBin = '/Applications/ZCashSwingWalletUI.app/Contents/MacOS/zcashd',
      api.zcashcliBin = '/Applications/ZCashSwingWalletUI.app/Contents/MacOS/zcash-cli',
      api.zcashDir = `${process.env.HOME}/Library/Application Support/Zcash`,
      api.zcashParamsDir = `${process.env.HOME}/Library/Application Support/ZcashParams`,
      api.chipsBin = path.join(__dirname, '../../assets/bin/osx/chipsd'),
      api.chipscliBin = path.join(__dirname, '../../assets/bin/osx/chips-cli'),
      api.chipsDir = `${process.env.HOME}/Library/Application Support/Chips`,
      api.coindRootDir = path.join(__dirname, '../../assets/bin/osx/dex/coind'),
      api.mmBin = path.join(__dirname, '../../node_modules/marketmaker/bin/darwin/x64/marketmaker');
      return api;
      break;

    case 'linux':
      api.agamaTestDir = `${process.env.HOME}/.verus/test`,
      api.komododBin = path.join(__dirname, '../../assets/bin/linux64/komodod'),
      api.komodocliBin = path.join(__dirname, '../../assets/bin/linux64/komodo-cli'),
      api.veruscliBin = path.join(__dirname, '../../assets/bin/linux64/verusd/verus'),
      api.komodocliDir = path.join(__dirname, '../../assets/bin/linux64'),
      api.komodoDir = `${process.env.HOME}/.komodo`,
      api.vrscDir = `${process.env.HOME}/.komodo/VRSC`,
      api.verusDir = `${process.env.HOME}/.verus`,
      api.verusTestDir = `${process.env.HOME}/.verustest`,
      api.zcashParamsDir = `${process.env.HOME}/.zcash-params`,
      api.chipsBin = path.join(__dirname, '../../assets/bin/linux64/chipsd'),
      api.chipscliBin = path.join(__dirname, '../../assets/bin/linux64/chips-cli'),
      api.chipsDir = `${process.env.HOME}/.chips`,
      api.coindRootDir = path.join(__dirname, '../../assets/bin/linux64/dex/coind'),
      api.mmBin = path.join(__dirname, '../../node_modules/marketmaker/bin/linux/x64/marketmaker');
      return api;
      break;

    case 'win32':
      api.agamaTestDir = `${process.env.APPDATA}/Verus/test`;
      api.agamaTestDir = path.normalize(api.agamaTestDir);
      api.komododBin = path.join(__dirname, '../../assets/bin/win64/komodod.exe'),
      api.komododBin = path.normalize(api.komododBin),
      api.komodocliBin = path.join(__dirname, '../../assets/bin/win64/komodo-cli.exe'),
      api.komodocliBin = path.normalize(api.komodocliBin),
      api.veruscliBin = path.join(__dirname, '../../assets/bin/win64/verusd/verus.exe'),
      api.veruscliBin = path.normalize(api.veruscliBin),
      api.komodocliDir = path.join(__dirname, '../../assets/bin/win64'),
      api.komodocliDir = path.normalize(api.komodocliDir),
      api.komodoDir = `${process.env.APPDATA}/Komodo`,
      api.komodoDir = path.normalize(api.komodoDir),
      api.vrscDir = `${process.env.APPDATA}/Komodo/VRSC`,
      api.vrscDir = path.normalize(api.vrscDir),
      api.verusDir = `${process.env.APPDATA}/Verus`,
      api.verusDir = path.normalize(api.verusDir),
      api.verusTestDir = `${process.env.APPDATA}/VerusTest`,
      api.verusTestDir = path.normalize(api.verusTestDir),
      api.chipsBin = path.join(__dirname, '../../assets/bin/win64/chipsd.exe'),
      api.chipsBin = path.normalize(api.chipsBin),
      api.chipscliBin = path.join(__dirname, '../../assets/bin/win64/chips-cli.exe'),
      api.chipscliBin = path.normalize(api.chipscliBin),
      api.chipsDir = `${process.env.APPDATA}/Chips`,
      api.chipsDir = path.normalize(api.chipsDir);
      api.zcashParamsDir = `${process.env.APPDATA}/ZcashParams`;
      api.zcashParamsDir = path.normalize(api.zcashParamsDir);
      api.coindRootDir = path.join(__dirname, '../../assets/bin/osx/dex/coind');
      api.coindRootDir = path.normalize(api.coindRootDir);
      api.mmBin = path.join(__dirname, '../../node_modules/marketmaker/bin/win32/x64/marketmaker.exe');
      api.mmBin = path.normalize(api.mmBin);
      return api;
      break;
  }
}

const customPathsDaemons = (api, daemonName) => {
  if (!api) api = {};

  let binName = daemonName + "Bin";
  switch (os.platform()) {
    case 'darwin':
      fixPath();
      api[binName] = path.join(__dirname, `../../assets/bin/osx/${daemonName}/${daemonName}`);
      return api;
      break;
    case 'linux':
      api[binName] = path.join(__dirname, `../../assets/bin/linux64/${daemonName}/${daemonName}`);
      return api;
      break;
    case 'win32':
      api[binName] = path.join(__dirname, `../../assets/bin/win64/${daemonName}/${daemonName}.exe`),
      api[binName] = path.normalize(api[binName]);
      return api;
      break;
  }
}

module.exports = {
  pathsAgama,
  pathsDaemons,
  customPathsDaemons
};
