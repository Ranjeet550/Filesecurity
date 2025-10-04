const REQUEST_KEY = 'mySecretKeyForResponses';
const FIXED_IV = new Uint8Array(16).fill(0); // Fixed IV

const encryptRequest = async (data) => {
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
    { name: 'AES-CBC', iv: FIXED_IV },
    aesKey,
    new TextEncoder().encode(JSON.stringify(data))
  );
  return {
    encrypted: Array.from(new Uint8Array(encrypted)).map(b => b.toString(16).padStart(2, '0')).join('')
  };
};

export { encryptRequest };