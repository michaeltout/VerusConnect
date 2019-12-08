/*
  KV lite format description:

  kv-version:encryption:tag:content

  kv-version: two bytes representing format version

  tag: any string 64 length max
  name: any string 64 length max

  predefined formats

  profile:
  01 0 profile
  ex. 010 profile john doe RjaTxL1QYdEp2cMAJaWXS3E1XThcTKT5Mj slack @jdoe, email jdoe@johndoe.com

  profile content format
  raddress:name:content
  name: any string 64 length max
  raddress: raddress, 64 bytes

  content format
  title:version:content

  title: any string 128 length max
  version: version(revision) of content
  content: any string 4096 chars max

  random content example:
  01:0:0:post:test post from john doe:test test test 1234
*/

/*const iocane = require('iocane');
const session = iocane.createSession()
  .use('cbc')
  .setDerivationRounds(300000);

const encrypt = session.encrypt.bind(session);
const decrypt = session.decrypt.bind(session);*/

const KV_OPRETURN_MAX_SIZE_BYTES = 8192;

const KV_VERSION = {
  current: '01',
  minSupported: '01',
};

// fixed size
const KV_HEADER_SIZE = [
  2, // kv version
  1, // encrypted
  64 // tag
];

// variable size
const KV_CONTENT_HEADER_SIZE = [
  3, // content version
  64, // previous txid
  128, // title
];

const KV_MAX_CONTENT_SIZE = 4096;

module.exports = (api) => {
  api.kvEncode = (data) => {
    let kvBuf = [
      Buffer.alloc(KV_HEADER_SIZE[0]),
      Buffer.alloc(KV_HEADER_SIZE[1]),
      Buffer.alloc(KV_HEADER_SIZE[2]),
      Buffer.alloc(KV_CONTENT_HEADER_SIZE[0]),
      Buffer.alloc(KV_CONTENT_HEADER_SIZE[1]),
      Buffer.alloc(KV_CONTENT_HEADER_SIZE[2]),
      Buffer.alloc(data.content.body.length)
    ];

    kvBuf[0].write(KV_VERSION.current);
    kvBuf[1].write('0');
    kvBuf[2].write(data.tag);
    kvBuf[3].write(data.content.version.toString());
    kvBuf[4].write(data.content.parent ? data.content.parent : '0000000000000000000000000000000000000000000000000000000000000000');
    kvBuf[5].write(data.content.title);
    kvBuf[6].write(data.content.body);

    api.log(data.content.body.length, 'kv');
    api.log(data.content.body, 'kv');
    api.log(kvBuf[6], 'kv');
    api.log(kvBuf[6].toString(), 'kv');

    const out = Buffer.concat(kvBuf);

    api.log(out, 'kv');
    api.log(out.toString('hex'), 'kv');
    api.log(out.toString('hex').length, 'kv');

    if (out.toString('hex').length > KV_MAX_CONTENT_SIZE + KV_CONTENT_HEADER_SIZE[0] + KV_CONTENT_HEADER_SIZE[1] + KV_CONTENT_HEADER_SIZE[2]) {
      return -1;
    }

    return out.toString('hex');
  }

  api.kvDecode = (hex, fromTx) => {
    api.log(Buffer.from(hex, 'hex').toString(), 'kv');

    if (fromTx) {
      hex = Buffer.from(hex, 'hex').toString();
    }

    const _kvBuf = Buffer.from(hex, 'hex');

    const kvBuf = [
      _kvBuf.slice(0, KV_HEADER_SIZE[0]),
      _kvBuf.slice(KV_HEADER_SIZE[0], KV_HEADER_SIZE[0] + KV_HEADER_SIZE[1]),
      _kvBuf.slice(KV_HEADER_SIZE[0] + KV_HEADER_SIZE[1], KV_HEADER_SIZE[0] + KV_HEADER_SIZE[1] + KV_HEADER_SIZE[2]),
      _kvBuf.slice(KV_HEADER_SIZE[0] + KV_HEADER_SIZE[1] + KV_HEADER_SIZE[2], KV_HEADER_SIZE[0] + KV_HEADER_SIZE[1] + KV_HEADER_SIZE[2] + KV_CONTENT_HEADER_SIZE[0]),
      _kvBuf.slice(KV_HEADER_SIZE[0] + KV_HEADER_SIZE[1] + KV_HEADER_SIZE[2] + KV_CONTENT_HEADER_SIZE[0], KV_HEADER_SIZE[0] + KV_HEADER_SIZE[1] + KV_HEADER_SIZE[2] + KV_CONTENT_HEADER_SIZE[0] + KV_CONTENT_HEADER_SIZE[1]),
      _kvBuf.slice(KV_HEADER_SIZE[0] + KV_HEADER_SIZE[1] + KV_HEADER_SIZE[2] + KV_CONTENT_HEADER_SIZE[0] + KV_CONTENT_HEADER_SIZE[1], KV_HEADER_SIZE[0] + KV_HEADER_SIZE[1] + KV_HEADER_SIZE[2] + KV_CONTENT_HEADER_SIZE[0] + KV_CONTENT_HEADER_SIZE[1] + KV_CONTENT_HEADER_SIZE[2]),
      _kvBuf.slice(KV_HEADER_SIZE[0] + KV_HEADER_SIZE[1] + KV_HEADER_SIZE[2] + KV_CONTENT_HEADER_SIZE[0] + KV_CONTENT_HEADER_SIZE[1] + KV_CONTENT_HEADER_SIZE[2], _kvBuf.length)
    ];

    api.log('kv buffer', 'kv');
    api.log(kvBuf, 'kv');

    for (let i = 0; i < kvBuf.length; i++) {
      api.log(`kv buffer ${i}, ${kvBuf[i].length} bytes`, 'kv');
      api.log(`kv buffer -> string ${kvBuf[i].length} bytes`, 'kv');
      api.log(kvBuf[i].toString(), 'kv');
    }

    const out = {
      version: kvBuf[0].toString().replace(/\0/g, ''),
      encrypted: kvBuf[1].toString().replace(/\0/g, ''),
      tag: kvBuf[2].toString().replace(/\0/g, ''),
      content: {
        version: kvBuf[3].toString().replace(/\0/g, ''),
        parent: kvBuf[4].toString().replace(/\0/g, ''),
        title: kvBuf[5].toString().replace(/\0/g, ''),
        body: kvBuf[6].toString().replace(/\0/g, ''),
      },
    };

    if (out.version &&
        out.encrypted &&
        out.content.version) {
      return out;
    } else {
      return false;
    }
  }

  api.get('/electrum/kv/test', (req, res, next) => {
    api.kvEncode({
      tag: 'trollbox',
      content: {
        title: 'Anonymous troll',
        version: 1,
        body: 'test test test test',
      },
    });

    const retObj = {
      msg: 'success',
      result: '',
    };

    res.end(JSON.stringify(retObj));
  });

  api.get('/electrum/kv/test/decode', (req, res, next) => {
    const kvtest = '33303331333037343635373337343030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303330333130303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330333033303330353436383639373332303639373332303631323037343635373337343230366237363030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303734363537333734323037343635373337343230373436353733373432303734363537333734';
    const decodedKv = api.kvDecode(kvtest, req.query.fromtx);

    const retObj = {
      msg: 'success',
      result: decodedKv,
    };

    res.end(JSON.stringify(retObj));
  });

  return api;
};