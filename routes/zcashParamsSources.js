const zcashParamsSources = {
  'agama.komodoplatform.com': {
    proving: 'https://agama.komodoplatform.com/file/supernet/sprout-proving.key',
    verifying: 'https://agama.komodoplatform.com/file/supernet/sprout-verifying.key',
    spend: 'https://agama.komodoplatform.com/file/komodo/sapling-params/sapling-spend.params',
    output: 'https://agama.komodoplatform.com/file/komodo/sapling-params/sapling-output.params',
    groth16: 'https://agama.komodoplatform.com/file/komodo/sapling-params/sprout-groth16.params',
  },
  'z.cash': {
    proving: 'https://z.cash/downloads/sprout-proving.key',
    verifying: 'https://z.cash/downloads/sprout-verifying.key',
    spend: 'https://z.cash/downloads/sapling-spend.params',
    output: 'https://z.cash/downloads/sapling-output.params',
    groth16: 'https://z.cash/downloads/sprout-groth16.params',
  },
  'veruscoin.io': {
    proving: 'https://veruscoin.io/zcparams/sprout-proving.key',
    verifying: 'https://veruscoin.io/zcparams/sprout-verifying.key',
    spend: 'https://veruscoin.io/zcparams/sapling-spend.params',
    output: 'https://veruscoin.io/zcparams/sapling-output.params',
    groth16: 'https://veruscoin.io/zcparams/sprout-groth16.params',
  },
}

module.exports = zcashParamsSources;