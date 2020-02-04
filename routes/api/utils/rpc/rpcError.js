class RpcError extends Error {
  constructor(code = RPC_ERROR_UNKNOWN, ...params) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(...params)

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RpcError)
    }

    this.name = 'RpcError'
    // Custom debugging information
    this.code = code
    this.timestamp = (new Date()).getTime()
  }
}

module.exports = RpcError