import CryptoJS from 'crypto-js';

const REQUEST_KEY = 'mySecretKeyForResponses';
const FIXED_IV = CryptoJS.lib.WordArray.create(new Uint8Array(16).fill(0)); // Fixed IV

const encryptRequest = async (data) => {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    // Use Web Crypto API if available
    const key = new Uint8Array(32);
    const keyData = new TextEncoder().encode(REQUEST_KEY);
    key.set(keyData.slice(0, 32));
    const aesKey = await crypto.subtle.importKey(
      'raw',
      key,
      'AES-CBC',
      false,
      ['encrypt']
    );
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-CBC', iv: new Uint8Array(16).fill(0) },
      aesKey,
      new TextEncoder().encode(JSON.stringify(data))
    );
    return {
      encrypted: Array.from(new Uint8Array(encrypted)).map(b => b.toString(16).padStart(2, '0')).join('')
    };
  } else {
    // Fallback to crypto-js
    const key = CryptoJS.enc.Utf8.parse(REQUEST_KEY.padEnd(32, '\0').slice(0, 32));
    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), key, {
      iv: FIXED_IV,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    return {
      encrypted: encrypted.ciphertext.toString(CryptoJS.enc.Hex)
    };
  }
};

export { encryptRequest };