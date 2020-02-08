const coinDataTranslated = require('./coinDataTranslated')
const fiatList = require('./fiatList');
const zcashParamsSources = require('./zcashParamsSources')

let zCoins = {}
let nativeCoinStrings = {}

const coinObjArray = coinDataTranslated.getSimpleCoinArray().map(simpleCoinObj => {
  const coinObj = coinDataTranslated.getCoinObj(simpleCoinObj.id, false)

  if (coinObj.tags.includes('is_zcash')) zCoins[coinObj.id] = true
  else zCoins[coinObj.id] = false

  if (coinObj.available_modes.native === true) {
    nativeCoinStrings[coinObj.id] = ''
  }

  return coinObj
})

const appConfig = {
  config: {
    general: {
      main: {
        host: "127.0.0.1",
        agamaPort: 17775,
        maxDescriptors: {
          darwin: 90000,
          linux: 1000000
        },
        dev: false,
        debug: false,
        roundValues: false,
        experimentalFeatures: false,
        dex: {
          walletUnlockTimeout: 3600
        },
        lang: "EN",
        fiatRates: true,
        fiatCurrency: "USD",
        loadCoinsFromStorage: false,
        requirePinToConfirmTx: false,
        defaultUserId: "",
        reservedChains: coinObjArray
          .map(coinObj => coinObj.id)
          .concat(["KOMODO", "zcashd", "komodod", "chipsd"]),
        pbaasChains: [],
        pbaasTestmode: true,
        enableVrsctest: false
      },
      electrum: {
        maxVinParseLimit: 120,
        cache: false,
        proxy: false,
        socketTimeout: 10000,
        customServers: false,
        maxTxListLength: 10,
        csvListtransactionsMaxLength: 400,
        syncServerListFromKv: false
      },
      native: {
        rpc2cli: false,
        cliStopTimeout: 30000,
        failedRPCAttemptsThreshold: 10,
        stopNativeDaemonsOnQuit: true,
        dataDir: "",
        maxTxListLength: 2147483647,
        csvListtransactionsMaxLength: 1000,
        zcashParamsSrc: "z.cash",
        includeP2shAddrs: false,
        includeEmptyChangeAddrs: false,
        nativeCacheMbLimit: 30
        //TODO: Make update intervals configurable
      }
    },
    coin: {
      native: {
        includePrivateAddrs: zCoins,
        includePrivateBalances: zCoins,
        includePrivateTransactions: zCoins,
        stakeGuard: nativeCoinStrings,
        dataDir: nativeCoinStrings
      }
    },
    pubkey: "",
    exchanges: {
      coinswitchKey: ""
    }
  },
  schema: {
    general: {
      main: {
        host: {
          type: "text_input",
          displayName: "Hostname",
          info: "The application hostname."
        },
        agamaPort: {
          type: "number_input",
          displayName: "Verus Port",
          info:
            "The port with which the Verus GUI will communcate with its back end."
        },
        dev: {
          type: "checkbox",
          displayName: "Dev Mode",
          info:
            "Run Verus in devmode, where it will search for a running GUI instead of using the pre-compiled one."
        },
        pbaasTestmode: {
          type: "checkbox",
          displayName: "Verus Multiverse Testmode",
          info:
            "Changes Verus Multiverse capabilities to run in test mode. (Will work with only VRSCTEST)"
        },
        enableVrsctest: {
          type: "checkbox",
          displayName: "Enable VRSCTEST",
          info: "Enables the Verus Testnet as a coin to add."
        }
      },
      electrum: {
        proxy: {
          type: "checkbox",
          displayName: "Use proxy server",
          info: "Use a proxy server to connect to electrum."
        },
        socketTimeout: {
          type: "number_input",
          displayName: "Socket Timeout",
          info: "The timeout for connections to electrum."
        },
        customServers: {
          type: "checkbox",
          displayName: "Custom electrum servers",
          info: "Use custom electrum servers."
        },
        maxTxListLength: {
          type: "number_input",
          displayName: "Max Transaction List Length",
          info: "The maximum number of transactions to fetch per call."
        }
      },
      native: {
        maxTxListLength: {
          type: "number_input",
          displayName: "Max Transaction List Length",
          info: "The maximum number of transactions to fetch per call."
        },
        zcashParamsSrc: {
          type: "dropdown",
          options: Object.keys(zcashParamsSources),
          displayName: "ZCash Parameter Source",
          info: "The source for the initial ZCash parameter download."
        },
        includeP2shAddrs: {
          type: "checkbox",
          displayName: "Include Pay to Script Hash Addresses",
          info:
            "Include Pay to Script Hash addresses in your address list (ONLY SEND TO THESE IF YOU KNOW WHAT YOU ARE DOING)."
        },
        nativeCacheMbLimit: {
          type: "decimal_input",
          displayName: "Native Cache Size Limit (in Mb)",
          info:
            "Set the native cache size limit (in megabytes). (Improves performance by storing blockchain data in local memory)"
        },
        includeEmptyChangeAddrs: {
          type: "checkbox",
          displayName: "Include Empty Change Addresses",
          info:
            "Include automatically generated change adresses in your address list, even if they're empty."
        }
      }
    },
    coin: {
      native: {
        /*includePrivateAddrs: {
          type: 'checkbox',
          displayName: 'Fetch private addresses',
          info: 'Fetch private addresses when fetching addresses.',
        },
        includePrivateBalances: {
          type: 'checkbox',
          displayName: 'Fetch private balances',
          info: 'Fetch private balances when fetching balances.',
        },
        includePrivateTransactions: {
          type: 'checkbox',
          displayName: 'Fetch private transactions',
          info: 'Fetch private transactions when fetching transactions.',
        },*/
        stakeGuard: {
          type: "text_input",
          displayName: "StakeGuard address",
          info:
            "Sapling address for Verus StakeGuard. (Will be used when Verus is started)"
        },
        dataDir: {
          type: "text_input",
          displayName: "Custom data directory",
          info: "A custom directory for coin data."
        }
      }
    }
  }
};

module.exports = appConfig;
