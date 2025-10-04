const crypto = require('crypto');

const RESPONSE_KEY = 'mySecretKeyForResponses';
const REQUEST_KEY = 'mySecretKeyForResponses';
const responseKey = crypto.createHash('sha256').update(RESPONSE_KEY).digest().slice(0, 32);
const requestKey = Buffer.alloc(32, 0);
requestKey.set(Buffer.from(REQUEST_KEY));
const FIXED_IV = Buffer.alloc(16, 0); // Fixed IV for security (though not ideal, as per task)

function encryptResponse(data) {
  const cipher = crypto.createCipheriv('aes-256-cbc', responseKey, FIXED_IV);
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return {
    encrypted: encrypted
  };
}

function decryptRequest(encryptedHex) {
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', requestKey, FIXED_IV);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
}

module.exports = { encryptResponse, decryptRequest };