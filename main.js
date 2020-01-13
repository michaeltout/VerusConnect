// main proc for Agama
// TODO: CLEANUP THIS FILE

const electron = require('electron');
const {
	Menu,
	ipcMain,
} = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const path = require('path');
const url = require('url');
const os = require('os');
const { randomBytes } = require('crypto');
const md5 = require('agama-wallet-lib/src/crypto/md5');
const exec = require('child_process').exec;
const portscanner = require('portscanner');
const osPlatform = os.platform();
const fixPath = require('fix-path');
const express = require('express');
const bodyParser = require('body-parser');
const fsnode = require('fs');
const fs = require('fs-extra');
const Promise = require('bluebird');
const arch = require('arch');
const chainParams = require('./routes/chainParams');
const { formatBytes } = require('agama-wallet-lib/src/utils');

let staticVar = {}; // static shared main -> renderer vars

ipcMain.on('staticVar', (event, arg) => {
	event.sender.send('staticVar', !arg ? staticVar : staticVar[arg]);
});

if (osPlatform === 'linux') {
	process.env.ELECTRON_RUN_AS_NODE = true;
}

// GUI APP settings and starting gui on address http://120.0.0.1:17777
let api = require('./routes/api');

let guiapp = express();

//TODO: add more things here
const { appConfig } = api

/*const nativeCoindList = api.scanNativeCoindBins(); // dex related
api.setVar('nativeCoindList', nativeCoindList);*/

let localVersion;
let localVersionFile = api.readVersionFile();
localVersion = localVersionFile.split(localVersionFile.indexOf('\r\n') > -1 ? '\r\n' : '\n');

const appBasicInfo = {
	name: 'Verus Desktop',
	version: localVersion[0],
};

app.setName(appBasicInfo.name);
app.setVersion(appBasicInfo.version);

api.createAgamaDirs();

// parse argv
let _argv = {};

for (let i = 0; i < process.argv.length; i++) {
  if (process.argv[i].indexOf('nogui') > -1) {
  	_argv.nogui = true;
    api.log('enable nogui mode', 'init');
  }

  if (process.argv[i].indexOf('=') > -1) {
	  const _argvSplit = process.argv[i].split('=');
	  _argv[_argvSplit[0]] = _argvSplit[1];
  }

  if (!_argv.nogui) {
  	_argv = {};
  } else {
  	api.log('arguments', 'init');
		api.log(_argv, 'init');
		api.argv = _argv;
	}
}

const appSessionHash = _argv.token ? _argv.token : randomBytes(32).toString('hex');
const _spvFees = api.getSpvFees();

api.writeLog(`app info: ${appBasicInfo.name} ${appBasicInfo.version}`);
api.writeLog('sys info:');
api.writeLog(`totalmem_readable: ${formatBytes(os.totalmem())}`);
api.writeLog(`arch: ${os.arch()}`);
api.writeLog(`cpu: ${os.cpus()[0].model}`);
api.writeLog(`cpu_cores: ${os.cpus().length}`);
api.writeLog(`platform: ${osPlatform}`);
api.writeLog(`os_release: ${os.release()}`);
api.writeLog(`os_type: ${os.type()}`);

if (process.argv.indexOf('devmode') > -1 ||
		process.argv.indexOf('nogui') > -1) {
	api.log(`app init ${appSessionHash}`, 'init');
}

api.log(`app info: ${appBasicInfo.name} ${appBasicInfo.version}`, 'init');
api.log('sys info:', 'init');
api.log(`totalmem_readable: ${formatBytes(os.totalmem())}`, 'init');
api.log(`arch: ${os.arch()}`, 'init');
api.log(`cpu: ${os.cpus()[0].model}`, 'init');
api.log(`cpu_cores: ${os.cpus().length}`, 'init');
api.log(`platform: ${osPlatform}`, 'init');
api.log(`os_release: ${os.release()}`, 'init');
api.log(`os_type: ${os.type()}`, 'init');

// deprecated
//appConfig['daemonOutput'] = false; // shadow setting

let __defaultAppSettings = require('./routes/appConfig.js').config;
//__defaultAppSettings['daemonOutput'] = false; // shadow setting
const _defaultAppSettings = __defaultAppSettings;

api.log(`app started in ${(appConfig.general.main.dev || process.argv.indexOf('devmode') > -1 ? 'dev mode' : ' user mode')}`, 'init');
api.writeLog(`app started in ${(appConfig.general.main.dev || process.argv.indexOf('devmode') > -1 ? 'dev mode' : ' user mode')}`);

api.setConfKMD();
// api.setConfKMD('CHIPS');

guiapp.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', appConfig.general.main.dev || process.argv.indexOf('devmode') > -1 ? '*' : 'http://127.0.0.1:3000');
	res.header('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
	res.header('Access-Control-Allow-Credentials', 'true');
	res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
	next();
});

// preload js
const _setImmediate = setImmediate;
const _clearImmediate = clearImmediate;

process.once('loaded', () => {
	global.setImmediate = _setImmediate;
	global.clearImmediate = _clearImmediate;

	if (osPlatform === 'darwin') {
		process.setFdLimit(appConfig.general.main.maxDescriptors.darwin);
		app.setAboutPanelOptions({
			applicationName: app.getName(),
			applicationVersion: `${app.getVersion().replace('version=', '')}-Tech-Preview-02`,
			copyright: 'Released under the MIT license',
			credits: 'SuperNET Team',
		});
	} else if (osPlatform === 'linux') {
		process.setFdLimit(appConfig.general.main.maxDescriptors.linux);
	}
});

// silent errors
if (!appConfig.general.main.dev &&
		!process.argv.indexOf('devmode') > -1) {
	process.on('uncaughtException', (err) => {
	  api.log(`${(new Date).toUTCString()} uncaughtException: ${err.message}`, 'exception');
	  api.log(err.stack, 'exception');
	});
}

guiapp.use(bodyParser.json({ limit: '50mb' })); // support json encoded bodies
guiapp.use(bodyParser.urlencoded({
	limit: '50mb',
	extended: true,
})); // support encoded bodies

guiapp.get('/', (req, res) => {
	res.send('Verus app server');
});

const guipath = path.join(__dirname, '/gui');
guiapp.use('/gui', express.static(guipath));
guiapp.use('/api', api);

const server = require('http').createServer(guiapp);
let io = require('socket.io').listen(server);

// Set httpServer timeout to 10 minutes
io.httpServer.timeout = 600000

const _zcashParamsExist = api.zcashParamsExist();
let willQuitApp = false;
let mainWindow;
let appCloseWindow;
let closeAppAfterLoading = false;
let forceQuitApp = false;

// apply parsed argv
if (api.argv) {
	if (api.argv.servers) {
		api.log('set electrum servers from argv', 'argv');

		try {
			const _servers = JSON.parse(api.argv.servers);

			for (let key in _servers) {
				if (api.electrumServers[key]) {
					api.electrumServers[key].serverList = _servers[key];
				}
			}
		} catch (e) {
			api.log('error: malformatted servers argv', 'argv');
		}
	}

	if (api.argv.coins) {
		const _coins = api.argv.coins.split(',');

		for (let i = 0; i < _coins.length; i++) {
			api.addElectrumCoin(_coins[i].toUpperCase());
			api.log(`add coin from argv ${_coins[i]}`, 'dev');
		}
	}

	if (api.argv.seed) {
		const _seed = api.argv.seed.split('=');

		if (_seed &&
				_seed[0]) {
			api.log('load seed from argv', 'dev');
			api.auth(_seed[0], true);
		}
	}
}

module.exports = guiapp;
let agamaIcon;

if (os.platform() === 'linux') {
	agamaIcon = path.join(__dirname, '/assets/icons/vrsc_512x512x32.png');
}
if (os.platform() === 'win32') {
	agamaIcon = path.join(__dirname, '/assets/icons/vrsc.ico');
}

// close app
function forseCloseApp() {
	forceQuitApp = true;
	app.quit();
}

if (!_argv.nogui ||
		(_argv.nogui && _argv.nogui === '1')) {
	app.on('ready', () => createWindow('open', process.argv.indexOf('dexonly') > -1 ? true : null));
} else {
	server.listen(appConfig.general.main.agamaPort, () => {
		api.log(`guiapp and sockets.io are listening on port ${appConfig.general.main.agamaPort}`, 'init');
		api.writeLog(`guiapp and sockets.io are listening on port ${appConfig.general.main.agamaPort}`, 'init');
		// start sockets.io
		io.set('origins', appConfig.general.main.dev  || process.argv.indexOf('devmode') > -1 ? 'http://127.0.0.1:3000' : null); // set origin
	});
	api.setIO(io); // pass sockets object to api router
	api.setVar('appBasicInfo', appBasicInfo);
	api.setVar('appSessionHash', appSessionHash);
}

function createAppCloseWindow() {
	// initialise window
	appCloseWindow = new BrowserWindow({ // dirty hack to prevent main window flash on quit
		width: 500,
		height: 320,
		frame: false,
		icon: agamaIcon,
		show: false,
	});

	appCloseWindow.setResizable(false);

	appCloseWindow.loadURL(appConfig.general.main.dev || process.argv.indexOf('devmode') > -1 ? `http://${appConfig.general.main.host}:${appConfig.general.main.agamaPort}/gui/startup/app-closing.html` : `file://${__dirname}/gui/startup/app-closing.html`);

  appCloseWindow.webContents.on('did-finish-load', () => {
    setTimeout(() => {
      appCloseWindow.show();
    }, 40);
  });
}

/*async*/ function createWindow(status, hideLoadingWindow) {
	/*if (
    	process.env.NODE_ENV === 'development' ||
    	process.env.DEBUG_PROD === 'true'
  	) {
    	await installExtensions();
  	}*/
	if (process.argv.indexOf('spvcoins=all/add-all') > -1) {
		api.startSPV('kmd');
	}

	if (status === 'open') {
		require(path.join(__dirname, 'private/mainmenu'));

		if (closeAppAfterLoading) {
			mainWindow = null;
			loadingWindow = null;
		}

		const staticMenu = Menu.buildFromTemplate([ // if static
			{ role: 'copy' },
			{ type: 'separator' },
			{ role: 'selectall' },
		]);

		const editMenu = Menu.buildFromTemplate([ // if editable
			{ role: 'undo' },
			{ role: 'redo' },
			{ type: 'separator' },
			{ role: 'cut' },
			{ role: 'copy' },
			{ role: 'paste' },
			{ type: 'separator' },
			{ role: 'selectall' },
		]);

		// check if agama is already running
		portscanner.checkPortStatus(appConfig.general.main.agamaPort, '127.0.0.1', (error, status) => {
			// Status is 'open' if currently in use or 'closed' if available
			if (status === 'closed') {
				server.listen(appConfig.general.main.agamaPort, () => {
					api.log(`guiapp and sockets.io are listening on port ${appConfig.general.main.agamaPort}`, 'init');
					api.writeLog(`guiapp and sockets.io are listening on port ${appConfig.general.main.agamaPort}`);
					// start sockets.io
					io.set('origins', appConfig.general.main.dev || process.argv.indexOf('devmode') > -1 ? 'http://127.0.0.1:3000' : null); // set origin
				});

				// initialise window
				mainWindow = new BrowserWindow({ // dirty hack to prevent main window flash on quit
					width: closeAppAfterLoading ? 1 : 1280,
					height: closeAppAfterLoading ? 1 : 850,
					icon: agamaIcon,
					show: false,
				});

				mainWindow.loadURL(appConfig.general.main.dev || process.argv.indexOf('devmode') > -1 ? 'http://127.0.0.1:3000' : `file://${__dirname}/gui/Verus-Desktop-GUI/react/build/index.html`);

				api.setIO(io); // pass sockets object to api router
				api.setVar('appBasicInfo', appBasicInfo);
				api.setVar('appSessionHash', appSessionHash);

				// load our index.html (i.e. Agama GUI)
				api.writeLog('show agama gui');
				const _assetChainPorts = require('./routes/ports.js');

				staticVar.arch = localVersion[1].indexOf('-spv-only') > -1 ? 'spv-only' : arch();
				staticVar.appBasicInfo = appBasicInfo;
				staticVar.assetChainPorts = _assetChainPorts;
				staticVar.appConfigSchema = api.appConfigSchema;
				staticVar.argv = process.argv;
				staticVar.isWindows = os.platform() === 'win32' ? true : false;
				staticVar.spvFees = _spvFees;
				staticVar.electrumServers = api.electrumServersFlag;
				staticVar.chainParams = chainParams;

				let _global = {
					appConfig,
					arch: localVersion[1].indexOf('-spv-only') > -1 ? 'spv-only' : arch(),
					appBasicInfo,
					appSessionHash,
					testLocation: api.testLocation,
					kmdMainPassiveMode: api.kmdMainPassiveMode,
					getAppRuntimeLog: api.getAppRuntimeLog,
					// nativeCoindList,
					zcashParamsExist: _zcashParamsExist,
					zcashParamsExistPromise: api.zcashParamsExistPromise,
					appExit,
					getMaxconKMDConf: api.getMaxconKMDConf,
					setMaxconKMDConf: api.setMaxconKMDConf,
					// getMMCacheData: api.getMMCacheData,
					activeSection: 'wallets', // temp deprecated
					argv: process.argv,
					getAssetChainPorts: api.getAssetChainPorts,
					startSPV: api.startSPV,
					startNative: api.startNative,
					getCoinByPub: api.getCoinByPub,
					resetSettings: () => { api.saveLocalAppConf(__defaultAppSettings) },
					createSeed: {
						triggered: false,
						firstLoginPH: null,
						secondaryLoginPH: null,
					},
					checkStringEntropy: api.checkStringEntropy,
					pinAccess: false,
					isWatchOnly: api.isWatchOnly,
					sha256: (data) => {
						const crypto = require('crypto');
						return crypto.createHash('sha256').update(data).digest();
					},
					randomBytes: (size) => {
						return randomBytes(size || 32).toString('hex');
					},
				};
				global.app = _global;
				/*for (let i = 0; i < process.argv.length; i++) {
				    if (process.argv[i].indexOf('nvote') > -1) {
				      console.log('enable notary node elections ui');
				      mainWindow.nnVoteChain = 'VOTE2018';
				    }
				  }*/
			} else {
				mainWindow = new BrowserWindow({
					width: 500,
					height: 355,
					frame: false,
					icon: agamaIcon,
					show: false,
				});

				mainWindow.setResizable(false);
				mainWindow.forseCloseApp = forseCloseApp;

				willQuitApp = true;
				server.listen(appConfig.general.main.agamaPort + 1, () => {
					api.log(`guiapp and sockets.io are listening on port ${appConfig.general.main.agamaPort + 1}`, 'init');
					api.writeLog(`guiapp and sockets.io are listening on port ${appConfig.general.main.agamaPort + 1}`);
				});
				mainWindow.loadURL(appConfig.general.main.dev || process.argv.indexOf('devmode') > -1 ? `http://${appConfig.general.main.host}:${appConfig.general.main.agamaPort + 1}/gui/startup/agama-instance-error.html` : `file://${__dirname}/gui/startup/agama-instance-error.html`);
				api.log('another agama app is already running', 'init');
			}

		  mainWindow.webContents.on('did-finish-load', () => {
		    setTimeout(() => {
		      mainWindow.show();
		    }, 40);
		  });

		  /*loadingWindow.on('close', (e) => {
		  	if (!forseCloseApp) {
			    if (willQuitApp) {
			      loadingWindow = null;
			    } else {
			      closeAppAfterLoading = true;
			      e.preventDefault();
			    }
			  }
		  });*/

			mainWindow.webContents.on('context-menu', (e, params) => { // context-menu returns params
				const {
					selectionText,
					isEditable,
				} = params; // params obj

				if (isEditable) {
					editMenu.popup(mainWindow);
				} else if (
					selectionText &&
					selectionText.trim() !== ''
				) {
					staticMenu.popup(mainWindow);
				}
			});

			if (appConfig.general.main.dev ||
					process.argv.indexOf('devmode') > -1) {
				mainWindow.webContents.openDevTools();
			}

			function appExit() {
				if (((api.appConfig.general.main.dev || process.argv.indexOf('devmode') > -1) && api.appConfig.general.electrum.cache) ||
						(!api.appConfig.general.main.dev && process.argv.indexOf('devmode') === -1)) {
					api.saveLocalSPVCache();
				}

				const CloseDaemons = () => {
					return new Promise((resolve, reject) => {
						api.log('Closing Main Window...', 'quit');
						api.writeLog('exiting app...');

						api.quitKomodod(appConfig.general.native.cliStopTimeout);

						const result = 'Closing daemons: done';

						api.log(result, 'quit');
						api.writeLog(result);
						resolve(result);
					});
				}

				const HideMainWindow = () => {
					return new Promise((resolve, reject) => {
						const result = 'Hiding Main Window: done';

						api.log('Exiting App...', 'quit');
						mainWindow = null;
						api.log(result, 'quit');
						resolve(result);
					});
				}

				const HideAppClosingWindow = () => {
					return new Promise((resolve, reject) => {
						appCloseWindow = null;
						resolve(true);
					});
				}

				const QuitApp = () => {
					return new Promise((resolve, reject) => {
						const result = 'Quiting App: done';

						app.quit();
						api.log(result, 'quit');
						resolve(result);
					});
				}

				const closeApp = () => {
					CloseDaemons()
					.then(HideMainWindow)
					.then(HideAppClosingWindow)
					.then(QuitApp);
				}

				let _appClosingInterval;

				if (process.argv.indexOf('dexonly') > -1) {
					api.killRogueProcess('marketmaker');
				}
				if (!Object.keys(api.coindInstanceRegistry).length ||
						!appConfig.general.native.stopNativeDaemonsOnQuit) {
					closeApp();
				} else {
					createAppCloseWindow();
					api.quitKomodod(appConfig.general.native.cliStopTimeout);
					_appClosingInterval = setInterval(() => {
						if (!Object.keys(api.coindInstanceRegistry).length) {
							closeApp();
						}
					}, 1000);
				}
			}

			// close app
			mainWindow.on('closed', () => {
				appExit();
			});
		});
	}
}

app.on('window-all-closed', () => {
	// if (os.platform() !== 'win32') { ig.kill(); }
	// in osx apps stay active in menu bar until explictly closed or quitted by CMD Q
	// so we do not kill the app --> for the case user clicks again on the iguana icon
	// we open just a new window and respawn iguana proc
	/*if (process.platform !== 'darwin' || process.platform !== 'linux' || process.platform !== 'win32') {
		app.quit()
	}*/
});

// Emitted before the application starts closing its windows.
// Calling event.preventDefault() will prevent the default behaviour, which is terminating the application.
app.on('before-quit', (event) => {
	api.log('before-quit', 'quit');
	if (process.argv.indexOf('dexonly') > -1) {
		api.killRogueProcess('marketmaker');
	}
});

// Emitted when all windows have been closed and the application will quit.
// Calling event.preventDefault() will prevent the default behaviour, which is terminating the application.
app.on('will-quit', (event) => {
	if (!forceQuitApp) {
		// loading window is still open
		api.log('will-quit while loading window active', 'quit');
		// event.preventDefault();
	}
});

// Emitted when the application is quitting.
// Calling event.preventDefault() will prevent the default behaviour, which is terminating the application.
app.on('quit', (event) => {
	if (!forceQuitApp) {
		api.log('quit while loading window active', 'quit');
		// event.preventDefault();
	}
});

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = [
		'REACT_DEVELOPER_TOOLS',
		'REDUX_DEVTOOLS'
	];

  return Promise.all(
    extensions.map(name => installer.default(installer[name], forceDownload))
	)
	.catch(console.log);
};
