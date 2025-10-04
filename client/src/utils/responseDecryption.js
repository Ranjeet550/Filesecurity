const RESPONSE_KEY = 'mySecretKeyForResponses';
const FIXED_IV = new Uint8Array(16).fill(0); // Fixed IV

const decryptResponse = async (encryptedHex) => {
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
    { name: 'AES-CBC', iv: FIXED_IV },
    aesKey,
    encrypted
  );
  const decoder = new TextDecoder();
  return JSON.parse(decoder.decode(decrypted));
};

export { decryptResponse };