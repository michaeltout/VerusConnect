const fs = require('fs-extra');

module.exports = (api) => {
  /*
   *  type: POST
   *  params: none
   */
  api.post('/addressbook', async (req, res, next) => {
    const token = req.body.token;
    const data = req.body.data;

    if (api.checkToken(req.body.token)) {
      fs.writeFile(`${api.agamaDir}/shepherd/addressBook.json`, JSON.stringify(data), (err) => {
        if (err) {
          api.log('error writing address book file', 'addressBook');

          const retObj = {
            msg: 'error',
            result: 'error writing address book file',
          };

          res.end(JSON.stringify(retObj));
        } else {
          const retObj = {
            msg: 'success',
            result: 'address book is updated',
          };

          res.end(JSON.stringify(retObj));
        }
      });
    } else {
      const retObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(retObj));
    }
  });

  api.get('/addressbook', (req, res, next) => {
    if (api.checkToken(req.query.token)) {
      if (fs.existsSync(`${api.agamaDir}/shepherd/addressBook.json`)) {
        fs.readFile(`${api.agamaDir}/shepherd/addressBook.json`, 'utf8', (err, data) => {
          if (err) {
            const retObj = {
              msg: 'error',
              result: err,
            };

            res.end(JSON.stringify(retObj));
          } else {
            const retObj = {
              msg: 'success',
              result: JSON.parse(data),
            };

            res.end(JSON.stringify(retObj));
          }
        });
      } else {
        const retObj = {
          msg: 'error',
          result: 'address book doesn\'t exist',
        };

        res.end(JSON.stringify(retObj));
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