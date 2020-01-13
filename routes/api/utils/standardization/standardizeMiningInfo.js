/**
 * Standardizes the behaviour of the mining info object when passed in from 
 * the KMD or VRSC daemon, so GUI can expect standard behaviour.
 * 
 * @param {Object} mininginfo The mining info result object to standardize
 */
const standardizeMiningInfo = (mininginfo) => {
  if (mininginfo.localsolps != null && mininginfo.localhashps == null)
    mininginfo.localhashps = mininginfo.localsolps;

  if (mininginfo.numthreads === -1) mininginfo.numthreads = 0

  return mininginfo
}

module.exports = standardizeMiningInfo