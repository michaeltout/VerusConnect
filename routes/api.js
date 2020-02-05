// TODO: CLEANUP THIS FILE

const electron = require('electron');
const express = require('express');
const app = electron.app;
let api = express.Router();

api.setconf = require('../private/setconf.js');
api.nativeCoind = require('./nativeCoind.js');
api.nativeCoindList = {};
api.assetChainPorts = require('./ports.js');
api.assetChainPortsDefault = require('./ports.js');
api._appConfig = require('./appConfig.js');
api.chainParams = require('./chainParams')

api.coinsInitializing = [];
api.coindInstanceRegistry = {};
api.confFileIndex = {};
api.logFileIndex = {};
api.coindStdout = {};
api.guiLog = {};
api.rpcConf = {};
api.appRuntimeLog = [];
api.lockDownAddCoin = false;
api._isWatchOnly = false;

// dex cache
api.mmupass = null;
api.mmRatesInterval = null;
api.mmPublic = {
  coins: [],
  mmupass: null,
  swaps: [],
  bids: [],
  asks: [],
  isAuth: false,
  rates: {},
  prices: [],
  coinsHelper: {},
  stats: [],
  electrumServersList: {},
};

// spv vars and libs
api.electrum = {
  auth: false,
  coinData: {},
};
api.electrumKeys = {};
api.electrumCache = {};

api.electrumJSCore = require('./electrumjs/electrumjs.core.js');
api.electrumJSNetworks = require('./electrumjs/electrumjs.networks.js');
const {
  electrumServers,
  electrumServersFlag,
} = require('./electrumjs/electrumServers.js');
api.electrumServers = electrumServers;
api.electrumServersFlag = electrumServersFlag;
api.electrumServersV1_4 = {};

api.CONNECTION_ERROR_OR_INCOMPLETE_DATA = 'connection error or incomplete data';

api.appConfig = api._appConfig.config;

// core
api = require('./api/paths.js')(api);

api.pathsAgama();
api.pathsDaemons();

// core
api = require('./api/log.js')(api);
api = require('./api/config.js')(api);
api = require('./api/users.js')(api);
api = require('./api/nameCommitments.js')(api);
api = require('./api/init.js')(api);

api.createAgamaDirs();
api.appConfig = api.loadLocalConfig();

api.appConfigSchema = api._appConfig.schema;
api.defaultAppConfig = Object.assign({}, api.appConfig);
api.kmdMainPassiveMode = false;
api.native = {
  startParams: {},
  cache: {
    tx_cache: {},
    addr_balance_cache: {}
  }
};

api.seed = null;

// prices and price APIs
api.fiat = {}
api = require('./api/fiat/prices')(api);

// spv
api = require('./api/electrum/network.js')(api);
api = require('./api/electrum/coins.js')(api);
api = require('./api/electrum/keys.js')(api);
api = require('./api/electrum/auth.js')(api);
api = require('./api/electrum/merkle.js')(api);
api = require('./api/electrum/balances.js')(api);
api = require('./api/electrum/info.js')(api);
api = require('./api/electrum/addresses.js')(api);
api = require('./api/electrum/transactions.js')(api);
api = require('./api/electrum/parseTxAddresses.js')(api);
api = require('./api/electrum/decodeRawtx.js')(api);
api = require('./api/electrum/block.js')(api);
api = require('./api/electrum/createtx.js')(api);
api = require('./api/electrum/createtx-split.js')(api);
api = require('./api/electrum/createtx-multi.js')(api);
api = require('./api/electrum/interest.js')(api);
api = require('./api/electrum/listunspent.js')(api);
api = require('./api/electrum/estimate.js')(api);
api = require('./api/electrum/insight.js')(api);
api = require('./api/electrum/cache.js')(api);
api = require('./api/electrum/proxy.js')(api);
api = require('./api/electrum/servers.js')(api);
api = require('./api/electrum/csv.js')(api);
api = require('./api/electrum/utils.js')(api);
api = require('./api/electrum/remove')(api);
api = require('./api/electrum/send.js')(api);

//native
api = require('./api/native/addrBalance.js')(api);
api = require('./api/native/coins')(api);
api = require('./api/native/callDaemon')(api);
api = require('./api/native/addresses')(api);
api = require('./api/native/balances')(api);
api = require('./api/native/definedchains')(api);
api = require('./api/native/info')(api);
api = require('./api/native/mininginfo')(api);
api = require('./api/native/getTransaction.js')(api);
api = require('./api/native/transactions')(api);
api = require('./api/native/zoperations')(api);
api = require('./api/native/remove')(api);
api = require('./api/native/send.js')(api);
api = require('./api/native/nameRegistration.js')(api);
api = require('./api/native/idRegistration.js')(api);
api = require('./api/native/idRevocation.js')(api);
api = require('./api/native/idInformation.js')(api);
api = require('./api/native/idRecovery.js')(api);
api = require('./api/native/signdata.js')(api);
api = require('./api/native/verifydata.js')(api);
api = require('./api/native/generate.js')(api);
api = require('./api/native/coinSupply.js')(api);
api = require('./api/native/blockSubsidy.js')(api);
api = require('./api/native/shieldcoinbase.js')(api);

// general network calls
api.networkFees = {}
api.coinSupply = {}
api = require('./api/network/fees/btc/btcFees')(api)
api = require('./api/network/fees/networkFees')(api)
api = require('./api/network/supply/vrsc/vrscCoinSupply')(api)
api = require('./api/network/supply/zec/zecCoinSupply')(api)
api = require('./api/network/supply/coinSupply')(api)

// core
api = require('./api/dashboardUpdate.js')(api);
api = require('./api/binsUtils.js')(api);
api = require('./api/downloadUtil.js')(api);
api = require('./api/pin.js')(api);
api = require('./api/downloadBins.js')(api);
api = require('./api/downloadPatch.js')(api);
api = require('./api/downloadZcparams.js')(api);
api = require('./api/coinsList.js')(api);
api = require('./api/rpc.js')(api);
api = require('./api/kickstart.js')(api);
api = require('./api/debugLog.js')(api);
api = require('./api/confMaxconnections.js')(api);
api = require('./api/appInfo.js')(api);
api = require('./api/conf.js')(api);
api = require('./api/daemonControl.js')(api);
api = require('./api/auth.js')(api);
api = require('./api/coindWalletKeys.js')(api);
api = require('./api/addressBook.js')(api);
api = require('./api/dice.js')(api);
api = require('./api/system.js')(api);

// elections
api = require('./api/elections.js')(api);

// explorer
// api = require('./api/explorer/overview.js')(api);

// kv
api = require('./api/kv.js')(api);

// eth
api.eth = {
  coins: {},
  connect: {},
  gasPrice: {},
  tokenInfo: {},
  abi: {},
};
api = require('./api/eth/auth.js')(api);
api = require('./api/eth/keys.js')(api);
api = require('./api/eth/network.js')(api);
api = require('./api/eth/balances.js')(api);
api = require('./api/eth/addresses')(api);
api = require('./api/eth/info')(api);
api = require('./api/eth/transactions.js')(api);
api = require('./api/eth/coins.js')(api);
api = require('./api/eth/gasPrice.js')(api);
api = require('./api/eth/createtx.js')(api);
api = require('./api/eth/utils.js')(api);
api = require('./api/eth/remove')(api);
api = require('./api/eth/send.js')(api);

// exchanges
api.exchangesCache = {
  coinswitch: {},
};
api = require('./api/exchange/exchange')(api);
api = require('./api/exchange/coinswitch/coinswitch')(api);
api = require('./api/exchange/changelly/changelly')(api);
api.loadLocalExchangesCache();

api.printDirs();

// default route
api.get('/', (req, res, next) => {
  res.send('Agama app server2');
});

// expose sockets obj
api.setIO = (io) => {
  api.io = io;
};

api.setVar = (_name, _body) => {
  api[_name] = _body;
};

// spv
if (((api.appConfig.general.main.dev || process.argv.indexOf('devmode') > -1) && api.appConfig.general.electrum.cache) ||
    (!api.appConfig.general.main.dev && process.argv.indexOf('devmode') === -1)) {
  api.loadLocalSPVCache();
}

if (api.appConfig.general.electrum &&
    api.appConfig.general.electrum.customServers) {
  api.loadElectrumServersList();
} else {
  api.mergeLocalKvElectrumServers();
}

api.checkCoinConfigIntegrity();

if (api.appConfig.general.main.loadCoinsFromStorage) {
  api.loadCoinsListFromFile();
}

module.exports = api;