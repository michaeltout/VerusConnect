const Promise = require('bluebird');
const request = require('request');
const {
  RPC_TIMEOUT,
  RPC_WORK_QUEUE_DEPTH_EXCEEDED,
  RPC_ERROR_UNKNOWN,
  RPC_OK,
  RPC_PARSE_ERROR
} = require("../utils/rpc/rpcStatusCodes");
const RpcError = require('../utils/rpc/rpcError')

module.exports = (api) => {
  api.native.callDaemon = (coin, cmd, params, token) => {   
    //TODO: DELETE
    //console.log(coin)
    //console.log(cmd)
    //console.log(params)

    return new Promise((resolve, reject) => {
      let _payload;
  
      if (params) {
        _payload = {
          mode: null,
          chain: coin,
          cmd: cmd,
          params: params,
          rpc2cli: false, // Deprecated
          token: token,
        };
      } else {
        _payload = {
          mode: null,
          chain: coin,
          cmd: cmd,
          rpc2cli: false, // Deprecated
          token: token,
        };
      }
  
      const options = {
        url: `http://127.0.0.1:${api.appConfig.general.main.agamaPort}/api/cli`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ payload: _payload }),
        timeout: 120000,
      };
  
      request(options, (error, response, body) => {
        const rpcJsonParsed = api.native.convertRpcJson(body)

        if (rpcJsonParsed.msg === 'success') resolve(rpcJsonParsed.result);
        else reject(new RpcError(rpcJsonParsed.code, rpcJsonParsed.result))
      });
    });
  }

  api.post('/native/call_daemon', (req, res, next) => {
    const token = req.body.token;
    const params = req.body.params;
    const coin = req.body.chainTicker;
    const cmd = req.body.cmd;

    api.native.callDaemon(coin, cmd, params, token)
    .then((rpcRes) => {
      const retObj = {
        msg: 'success',
        result: rpcRes,
      };
  
      res.end(JSON.stringify(retObj));  
    })
    .catch(error => {
      const retObj = {
        msg: 'error',
        result: error.message,
      };
  
      res.end(JSON.stringify(retObj));  
    })
  });

  api.native.convertRpcJson = (json) => {
    if (json === 'Work queue depth exceeded') {
      return {
        msg: "error",
        code: RPC_WORK_QUEUE_DEPTH_EXCEEDED,
        result: "Daemon is busy"
      };
    } else if (!json) {
      return {
        msg: "error",
        code: RPC_TIMEOUT,
        result: "No response from daemon"
      };
    } else {
      let rpcJson

      try {
        rpcJson = JSON.parse(json)
      } catch (e) {
        return {
          msg: "error",
          code: RPC_PARSE_ERROR,
          result: "JSON format unrecognized"
        };
      }
      
      if (rpcJson.error || rpcJson.result === "error") {
        return {
          msg: "error",
          code: rpcJson.error ? rpcJson.error.code : RPC_ERROR_UNKNOWN,
          result: rpcJson.error ? rpcJson.error.message : "Unknown error"
        };
      } else if (rpcJson.hasOwnProperty('msg') && rpcJson.hasOwnProperty('result')) {
        return rpcJson
      } else {
        return { msg: "success", code: RPC_OK, result: rpcJson.result };
      }
    }
  }

  return api
}
