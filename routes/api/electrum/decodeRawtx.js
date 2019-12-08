module.exports = (api) => {
  // TODO: loop through vins/vouts
  api.get('/electrum/decoderawtx', (req, res, next) => {
    if (api.checkToken(req.query.token)) {
      const _network = api.getNetworkData(req.query.network);
      const _rawtx = req.query.rawtx;
      //const _rawtx = '010000006f2c395a02d81487fc7f9d1be3ea900316730133c044af70cd76d21e988e71de0e9e85918f010000006a47304402202097acd391e1d0eaaf91844bd596e918fb71320e3e0c51554acb71a39e4ee98b0220548fd61d4ae77a08d70b01bf5340983a1ba63f6b71ad71d478af77011f96fd510121031ffc010d8abc4180b4c1a13962bf9153a78082e7f2ac18f7d14cb6a6634ca218feffffff2b31f6c9a7916f7cf128cae94b3fc10e4c74ca3a740e1a7a6fd6624e4e9a5c8b010000006a473044022063f014c5fbaa7614732e0ae486179a854215fc32c02230e13f69b7e81fa000e50220236a2ba6373b1854aafc59c5391ab7505062067f3d293c016cbb5d252b35a56a012102f307f17d282fc0eabf99227c2e0f3122ae9ecd7da0de099f0c6007d4c941b57bfeffffff021b797ad7120000001976a914c7a7142d743b3e6eebe76923f43bae477d3ce31a88acff086d66000000001976a91463800ff36b9c52b2ffe5564af1c2a38df4f0126788ac16381d00';
      const decodedTx = api.electrumJSTxDecoder(_rawtx, req.query.network, _network);

      api.log('electrum decoderawtx input tx ==>', 'spv.decoderawtx');

      if (req.query.parseonly ||
          decodedTx.inputs[0].txid === '0000000000000000000000000000000000000000000000000000000000000000') {
        const retObj = {
          msg: 'success',
          result: {
            network: decodedTx.network,
            format: decodedTx.format,
            inputs: decodedTx.inputs,
            outputs: decodedTx.outputs,
          },
        };

        api.log(retObj.result, 'spv.decoderawtx');

        res.end(JSON.stringify(retObj));
      } else {
        async function _decodeRawTx() {
          const ecl = await api.ecl(req.query.network);

          api.log(decodedTx.inputs[0], 'spv.decoderawtx');
          api.log(decodedTx.inputs[0].txid, 'spv.decoderawtx');

          ecl.connect();
          ecl.blockchainTransactionGet(decodedTx.inputs[0].txid)
          .then((json) => {
            ecl.close();
            api.log(json, 'spv.decoderawtx');

            const decodedVin = api.electrumJSTxDecoder(json, req.query.network, _network);

            const retObj = {
              msg: 'success',
              result: {
                network: decodedTx.network,
                format: decodedTx.format,
                inputs: decodedVin.outputs[decodedTx.inputs[0].n],
                outputs: decodedTx.outputs,
              },
            };

            res.end(JSON.stringify(retObj));
          });
        };
        _decodeRawTx();
      }
    } else {
      const retObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(retObj));
    }
  });

  return api;
};