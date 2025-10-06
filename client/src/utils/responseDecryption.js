import CryptoJS from 'crypto-js';

const RESPONSE_KEY = 'mySecretKeyForResponses';
const FIXED_IV = CryptoJS.lib.WordArray.create(new Uint8Array(16).fill(0)); // Fixed IV

const decryptResponse = async (encryptedHex) => {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    // Use Web Crypto API if available
    const encrypted = new Uint8Array(encryptedHex.match(/.{2}/g).map(byte => parseInt(byte, 16)));
    const keyData = new TextEncoder().encode(RESPONSE_KEY);
    const hash = await crypto.subtle.digest('SHA-256', keyData);
    const key = new Uint8Array(hash).slice(0, 32);
    const aesKey = await crypto.subtle.importKey(
      'raw',
      key,
      'AES-CBC',
      false,
      ['decrypt']
    );
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-CBC', iv: new Uint8Array(16).fill(0) },
      aesKey,
      encrypted
    );
    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(decrypted));
  } else {
    // Fallback to crypto-js
    const keyData = CryptoJS.enc.Utf8.parse(RESPONSE_KEY);
    const hash = CryptoJS.SHA256(keyData);
    const key = CryptoJS.lib.WordArray.create(hash.words.slice(0, 8)); // 32 bytes
    const encrypted = CryptoJS.enc.Hex.parse(encryptedHex);
    const decrypted = CryptoJS.AES.decrypt({ ciphertext: encrypted }, key, {
      iv: FIXED_IV,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    const decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedStr);
  }
};

export { decryptResponse };