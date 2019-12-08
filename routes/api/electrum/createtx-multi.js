const bitcoin = require('bitgo-utxo-lib');
const coinSelect = require('coinselect');
const { estimateTxSize } = require('agama-wallet-lib/src/utils');

// not prod ready, only for voting!
// needs a fix

// TODO: spread fee across targets
//       current implementation subtracts fee from the fist target out
module.exports = (api) => {
  api.post('/electrum/createrawtx-multiout', (req, res, next) => {
    if (api.checkToken(req.body.token)) {
      // TODO: 1) unconf output(s) error message
      // 2) check targets integrity
      async function _createRawTxMultOut() {
        const network = req.body.network || api.validateChainTicker(req.body.coin);
        const ecl = await api.ecl(network);
        const initTargets = JSON.parse(JSON.stringify(req.body.targets));
        const changeAddress = req.body.change;
        const push = req.body.push;
        const opreturn = req.body.opreturn;
        const btcFee = req.body.btcfee ? Number(req.body.btcfee) : null;
        let fee = api.electrumServers[network].txfee;
        let wif = req.body.wif;
        let targets = req.body.targets;

        if (req.body.gui) {
          wif = api.electrumKeys[req.body.coin].priv;
        }

        if (req.body.vote) {
          wif = api.elections.priv;
        }

        if (btcFee) {
          fee = 0;
        }

        api.log('electrum createrawtx =>', 'spv.createrawtx');

        ecl.connect();
        api.electrum.listunspent(
          ecl,
          changeAddress,
          network,
          true,
          req.body.verify === 'true' ? true : null
        )
        .then((utxoList) => {
          ecl.close();

          if (utxoList &&
              utxoList.length &&
              utxoList[0] &&
              utxoList[0].txid) {
            let utxoListFormatted = [];
            let totalInterest = 0;
            let totalInterestUTXOCount = 0;
            let interestClaimThreshold = 200;
            let utxoVerified = true;

            for (let i = 0; i < utxoList.length; i++) {
              if (network === 'komodo' ||
                  network.toLowerCase() === 'kmd') {
                utxoListFormatted.push({
                  txid: utxoList[i].txid,
                  vout: utxoList[i].vout,
                  value: Number(utxoList[i].amountSats),
                  interestSats: Number(utxoList[i].interestSats),
                  verified: utxoList[i].verified ? utxoList[i].verified : false,
                });
              } else {
                utxoListFormatted.push({
                  txid: utxoList[i].txid,
                  vout: utxoList[i].vout,
                  value: Number(utxoList[i].amountSats),
                  verified: utxoList[i].verified ? utxoList[i].verified : false,
                });
              }
            }

            api.log('electrum listunspent unformatted ==>', 'spv.createrawtx');
            api.log(utxoList, 'spv.createrawtx');

            api.log('electrum listunspent formatted ==>', 'spv.createrawtx');
            api.log(utxoListFormatted, 'spv.createrawtx');

            const _maxSpendBalance = Number(api.maxSpendBalance(utxoListFormatted));
            /*let targets = [{
              address: outputAddress,
              value: value > _maxSpendBalance ? _maxSpendBalance : value,
            }];*/
            api.log('targets =>', 'spv.createrawtx');
            api.log(targets, 'spv.createrawtx');

            targets[0].value = targets[0].value + fee;

            api.log(`default fee ${fee}`, 'spv.createrawtx');
            api.log(`targets ==>`, 'spv.createrawtx');
            api.log(targets, 'spv.createrawtx');

            // default coin selection algo blackjack with fallback to accumulative
            // make a first run, calc approx tx fee
            // if ins and outs are empty reduce max spend by txfee
            const firstRun = coinSelect(
              utxoListFormatted,
              targets,
              btcFee ? btcFee : 0
            );
            let inputs = firstRun.inputs;
            let outputs = firstRun.outputs;

            if (btcFee) {
              api.log(`btc fee per byte ${btcFee}`, 'spv.createrawtx');
              fee = firstRun.fee;
            }

            api.log('coinselect res =>', 'spv.createrawtx');
            api.log('coinselect inputs =>', 'spv.createrawtx');
            api.log(inputs, 'spv.createrawtx');
            api.log('coinselect outputs =>', 'spv.createrawtx');
            api.log(outputs, 'spv.createrawtx');
            api.log('coinselect calculated fee =>', 'spv.createrawtx');
            api.log(fee, 'spv.createrawtx');

            if (!outputs) {
              targets[0].value = targets[0].value - fee;
              api.log('second run', 'spv.createrawtx');
              api.log('coinselect adjusted targets =>', 'spv.createrawtx');
              api.log(targets, 'spv.createrawtx');

              const secondRun = coinSelect(
                utxoListFormatted,
                targets,
                0
              );
              inputs = secondRun.inputs;
              outputs = secondRun.outputs;
              fee = fee ? fee : secondRun.fee;

              api.log('second run coinselect inputs =>', 'spv.createrawtx');
              api.log(inputs, 'spv.createrawtx');
              api.log('second run coinselect outputs =>', 'spv.createrawtx');
              api.log(outputs, 'spv.createrawtx');
              api.log('second run coinselect fee =>', 'spv.createrawtx');
              api.log(fee, 'spv.createrawtx');
            }

            let _change = 0;

            if (outputs &&
                outputs.length > 1 &&
                outputs.length > targets.length) {
              _change = outputs[outputs.length - 1].value - fee;
            }

            api.log(`change before adjustments ${_change}`, 'spv.createrawtx');

            if (!btcFee &&
                _change === 0) {
              outputs[0].value = outputs[0].value - fee;
            }

            api.log('adjusted outputs', 'spv.createrawtx');
            api.log(outputs, 'spv.createrawtx');

            api.log('init targets', 'spv.createrawtx');
            api.log(initTargets, 'spv.createrawtx');

            api.log('coinselect targets', 'spv.createrawtx');
            api.log(targets, 'spv.createrawtx');

            if (initTargets[0].value < targets[0].value) {
              targets[0].value = initTargets[0].value;
            }

            let _targetsSum = 0;

            for (let i = 0; i < targets.length; i++) {
              _targetsSum += Number(targets[i].value);
            }

            api.log(`total targets sum ${_targetsSum}`, 'spv.createrawtx');

            /*if (btcFee) {
              value = _targetsSum;
            } else {
              if (_change > 0) {
                value = _targetsSum - fee;
              }
            }*/
            value = _targetsSum;

            api.log('adjusted outputs, value - default fee =>', 'spv.createrawtx');
            api.log(outputs, 'spv.createrawtx');

            // check if any outputs are unverified
            if (inputs &&
                inputs.length) {
              for (let i = 0; i < inputs.length; i++) {
                if (!inputs[i].verified) {
                  utxoVerified = false;
                  break;
                }
              }

              for (let i = 0; i < inputs.length; i++) {
                if (Number(inputs[i].interestSats) > interestClaimThreshold) {
                  totalInterest += Number(inputs[i].interestSats);
                  totalInterestUTXOCount++;
                }
              }
            }

            const _maxSpend = api.maxSpendBalance(utxoListFormatted);

            if (value > _maxSpend) {
              const retObj = {
                msg: 'error',
                result: `Spend value is too large. Max available amount is ${Number((_maxSpend * 0.00000001.toFixed(8)))}`,
              };

              res.end(JSON.stringify(retObj));
            } else {
              api.log(`maxspend ${_maxSpend} (${_maxSpend * 0.00000001})`, 'spv.createrawtx');
              api.log(`value ${value}`, 'spv.createrawtx');
              // api.log(`sendto ${outputAddress} amount ${value} (${value * 0.00000001})`, true);
              api.log(`changeto ${changeAddress} amount ${_change} (${_change * 0.00000001})`, 'spv.createrawtx');

              // account for KMD interest
              if ((network === 'komodo' || network.toLowerCase() === 'kmd') &&
                  totalInterest > 0) {
                // account for extra vout
                // const _feeOverhead = outputs.length === 1 ? estimateTxSize(0, 1) * feeRate : 0;
                const _feeOverhead = 0;

                api.log(`max interest to claim ${totalInterest} (${totalInterest * 0.00000001})`, 'spv.createrawtx');
                api.log(`estimated fee overhead ${_feeOverhead}`, 'spv.createrawtx');
                api.log(`current change amount ${_change} (${_change * 0.00000001}), boosted change amount ${_change + (totalInterest - _feeOverhead)} (${(_change + (totalInterest - _feeOverhead)) * 0.00000001})`, 'spv.createrawtx');

                if (_maxSpend - fee === value) {
                  _change = totalInterest - _change - _feeOverhead;

                  if (outputAddress === changeAddress) {
                    value += _change;
                    _change = 0;
                    api.log(`send to self ${outputAddress} = ${changeAddress}`, 'spv.createrawtx');
                    api.log(`send to self old val ${value}, new val ${value + _change}`, 'spv.createrawtx');
                  }
                } else {
                  _change = _change + (totalInterest - _feeOverhead);
                }
              }

              if (!inputs &&
                  !outputs) {
                const retObj = {
                  msg: 'error',
                  result: 'Can\'t find best fit utxo. Try lower amount.',
                };

                res.end(JSON.stringify(retObj));
              } else {
                let vinSum = 0;
                let voutSum = 0;

                for (let i = 0; i < inputs.length; i++) {
                  vinSum += inputs[i].value;
                }

                for (let i = 0; i < outputs.length; i++) {
                  voutSum += outputs[i].value;
                }

                const _estimatedFee = vinSum - voutSum;

                api.log(`vin sum ${vinSum} (${vinSum * 0.00000001})`, 'spv.createrawtx');
                api.log(`vout sum ${voutSum} (${voutSum * 0.00000001})`, 'spv.createrawtx');
                api.log(`estimatedFee ${_estimatedFee} (${_estimatedFee * 0.00000001})`, 'spv.createrawtx');
                // double check no extra fee is applied
                api.log(`vin - vout - change ${vinSum - value - _change}`, 'spv.createrawtx');

                if ((vinSum - value - _change) > fee) {
                  _change += fee;
                  api.log(`double fee, increase change by ${fee}`, 'spv.createrawtx');
                  api.log(`adjusted vin - vout - change ${vinSum - value - _change}`, 'spv.createrawtx');
                }

                // TODO: use individual dust thresholds
                if (_change > 0 &&
                    _change <= 1000) {
                      api.log(`change is < 1000 sats, donate ${_change} sats to miners`, 'spv.createrawtx');
                  _change = 0;
                }

                outputAddress = outputs;

                if (!outputAddress[outputAddress.length - 1].address) {
                  outputAddress.pop();
                }

                let _rawtx;

                if (network === 'btg' ||
                    network === 'bch') {
                  /*_rawtx = api.buildSignedTxForks(
                    outputAddress,
                    changeAddress,
                    wif,
                    network,
                    inputs,
                    _change,
                    value
                  );*/
                } else {
                  _rawtx = api.buildSignedTxMulti(
                    outputAddress,
                    changeAddress,
                    wif,
                    network,
                    inputs,
                    _change,
                    value,
                    opreturn
                  );
                }

                if (!push ||
                    push === 'false') {
                  const retObj = {
                    msg: 'success',
                    result: {
                      utxoSet: inputs,
                      change: _change,
                      changeAdjusted: _change,
                      totalInterest,
                      // wif,
                      fee,
                      value,
                      outputAddress,
                      changeAddress,
                      network,
                      rawtx: _rawtx,
                      utxoVerified,
                    },
                  };

                  res.end(JSON.stringify(retObj));
                } else {
                  async function _pushtx() {
                    const ecl = await api.ecl(network);

                    ecl.connect();
                    ecl.blockchainTransactionBroadcast(_rawtx)
                    .then((txid) => {
                      ecl.close();

                      const _rawObj = {
                        utxoSet: inputs,
                        change: _change,
                        changeAdjusted: _change,
                        totalInterest,
                        fee,
                        value,
                        outputAddress,
                        changeAddress,
                        network,
                        rawtx: _rawtx,
                        txid,
                        utxoVerified,
                      };

                      if (txid &&
                          txid.indexOf('bad-txns-inputs-spent') > -1) {
                        const retObj = {
                          msg: 'error',
                          result: 'Bad transaction inputs spent',
                          raw: _rawObj,
                        };

                        res.end(JSON.stringify(retObj));
                      } else {
                        if (txid &&
                            txid.length === 64) {
                          if (txid.indexOf('bad-txns-in-belowout') > -1) {
                            const retObj = {
                              msg: 'error',
                              result: 'Bad transaction inputs spent',
                              raw: _rawObj,
                            };

                            res.end(JSON.stringify(retObj));
                          } else {
                            api.updatePendingTxCache(
                              network,
                              txid,
                              {
                                pub: changeAddress,
                                rawtx: _rawtx,
                              },
                            );

                            const retObj = {
                              msg: 'success',
                              result: _rawObj,
                            };

                            res.end(JSON.stringify(retObj));
                          }
                        } else {
                          if (txid &&
                              txid.indexOf('bad-txns-in-belowout') > -1) {
                            const retObj = {
                              msg: 'error',
                              result: 'Bad transaction inputs spent',
                              raw: _rawObj,
                            };

                            res.end(JSON.stringify(retObj));
                          } else {
                            const retObj = {
                              msg: 'error',
                              result: 'Can\'t broadcast transaction',
                              raw: _rawObj,
                            };

                            res.end(JSON.stringify(retObj));
                          }
                        }
                      }
                    });
                  }
                }
              }
            }
          } else {
            const retObj = {
              msg: 'error',
              result: utxoList,
            };

            res.end(JSON.stringify(retObj));
          }
        });
      };
      _createRawTxMultOut();
    } else {
      const retObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(retObj));
    }
  });

  // single sig
  api.buildSignedTxMulti = (sendTo, changeAddress, wif, network, utxo, changeValue, spendValue, opreturn) => {
    let key = bitcoin.ECPair.fromWIF(wif, api.getNetworkData(network));
    let tx = new bitcoin.TransactionBuilder(api.getNetworkData(network));

    api.log('buildSignedTx', 'spv.createrawtx');
    // console.log(`buildSignedTx priv key ${wif}`);
    api.log(`buildSignedTx pub key ${key.getAddress().toString()}`, 'spv.createrawtx');
    // console.log('buildSignedTx std tx fee ' + api.electrumServers[network].txfee);

    for (let i = 0; i < utxo.length; i++) {
      tx.addInput(utxo[i].txid, utxo[i].vout);
    }

    for (let i = 0; i < sendTo.length; i++) {
      if (api.isPos(network)) {
        tx.addOutput(
          sendTo[i].address,
          Number(sendTo[i].value),
          api.getNetworkData(network)
        );
      } else {
        tx.addOutput(sendTo[i].address, Number(sendTo[i].value));
      }
    }

    if (changeValue > 0) {
      if (api.isPos(network)) {
        tx.addOutput(
          changeAddress,
          Number(changeValue),
          api.getNetworkData(network)
        );
      } else {
        tx.addOutput(changeAddress, Number(changeValue));
      }
    }

    if (opreturn &&
        opreturn.length) {
      for (let i = 0; i < opreturn.length; i++) {
        const data = Buffer.from(opreturn[i], 'utf8');
        const dataScript = bitcoin.script.nullData.output.encode(data);
        tx.addOutput(dataScript, 1000);

        api.log(`opreturn ${i} ${opreturn[i]}`, 'spv.createrawtx');
      }
    }

    if (network === 'komodo' ||
        network.toUpperCase() === 'KMD') {
      const _locktime = Math.floor(Date.now() / 1000) - 777;
      tx.setLockTime(_locktime);
      api.log(`kmd tx locktime set to ${_locktime}`, 'spv.createrawtx');
    }

    api.log('buildSignedTx unsigned tx data vin', 'spv.createrawtx');
    api.log(tx.tx.ins, 'spv.createrawtx');
    api.log('buildSignedTx unsigned tx data vout', 'spv.createrawtx');
    api.log(tx.tx.outs, 'spv.createrawtx');
    api.log('buildSignedTx unsigned tx data', 'spv.createrawtx');
    api.log(tx, 'spv.createrawtx');

    for (let i = 0; i < utxo.length; i++) {
      if (api.isPos(network)) {
        tx.sign(
          api.getNetworkData(network),
          i,
          key
        );
      } else {
        tx.sign(i, key);
      }
    }

    const rawtx = tx.build().toHex();

    api.log('buildSignedTx signed tx hex', 'spv.createrawtx');
    api.log(rawtx, 'spv.createrawtx');

    return rawtx;
  }

  return api;
};
