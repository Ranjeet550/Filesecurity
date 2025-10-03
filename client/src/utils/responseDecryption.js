const RESPONSE_KEY = 'mySecretKeyForResponses';

const decryptResponse = async (ivHex, encryptedHex) => {
  const iv = new Uint8Array(ivHex.match(/.{2}/g).map(byte => parseInt(byte, 16)));
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
    { name: 'AES-CBC', iv: iv },
    aesKey,
    encrypted
  );
  const decoder = new TextDecoder();
  return JSON.parse(decoder.decode(decrypted));
};

export { decryptResponse };