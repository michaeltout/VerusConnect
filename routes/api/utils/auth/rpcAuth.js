/*
Copyright (c) 2019, Amalie Due Jensen <amaliedue@hyperdivision.dk>

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
*/

const crypto = require('crypto')

function generateSalt (size) {
  const buf = crypto.randomBytes(size)
  const salt = buf.toString('hex')
  return salt
}

function generateRpcPassword () {
  const buf = crypto.randomBytes(32)
  const password = Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
  return password
}

function passwordToHmac (salt, password) {
  const hmac = crypto.createHmac('sha256', salt)
  hmac.update(password)
  return hmac.digest('hex')
}

module.exports = {
  generateSalt,
  generateRpcPassword,
  passwordToHmac
}