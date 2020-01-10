const si = require('systeminformation')

module.exports = (api) => {
  /*
   *  type: GET
   */
  api.get('/get_static_system_data', (req, res, next) => {
    si.getStaticData()
    .then(data => {
      res.end(JSON.stringify({
        msg: 'success',
        result: data
      }));
    })
    .catch(e => {
      res.end(JSON.stringify({
        msg: 'error',
        result: e.message
      }));
    })
  });

  /*
   *  type: GET
   */
  api.get('/get_cpu_temp', (req, res, next) => {
    si.cpuTemperature()
    .then(data => {
      res.end(JSON.stringify({
        msg: 'success',
        result: data
      }));
    })
    .catch(e => {
      console.error(e)

      res.end(JSON.stringify({
        msg: 'error',
        result: e.message
      }));
    })
  });

  /*
   *  type: GET
   */
  api.get('/get_cpu_load', (req, res, next) => {
    si.currentLoad()
    .then(data => {
      res.end(JSON.stringify({
        msg: 'success',
        result: data
      }));
    })
    .catch(e => {
      console.error(e)

      res.end(JSON.stringify({
        msg: 'error',
        result: e.message
      }));
    })
  });

  /*
   *  type: GET
   */
  api.get('/get_sys_time', (req, res, next) => {
    try {
      res.end(JSON.stringify({
        msg: 'success',
        result: si.time()
      }));
    } catch (e) {
      console.error(e)
      
      res.end(JSON.stringify({
        msg: 'error',
        result: e.message
      }));
    }
  });

  return api;
};