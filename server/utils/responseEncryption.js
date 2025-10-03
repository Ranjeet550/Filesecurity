const crypto = require('crypto');

const RESPONSE_KEY = 'mySecretKeyForResponses';
const REQUEST_KEY = 'mySecretKeyForResponses';
const responseKey = crypto.createHash('sha256').update(RESPONSE_KEY).digest().slice(0, 32);
const requestKey = Buffer.alloc(32, 0);
requestKey.set(Buffer.from(REQUEST_KEY));

function encryptResponse(data) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', responseKey, iv);
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return {
    iv: iv.toString('hex'),
    encrypted: encrypted
  };
}

function decryptRequest(ivHex, encryptedHex) {
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', requestKey, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
}

module.exports = { encryptResponse, decryptRequest };