const REQUEST_KEY = 'mySecretKeyForResponses';

const encryptRequest = async (data) => {
  const iv = window.crypto.getRandomValues(new Uint8Array(16));
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
    { name: 'AES-CBC', iv: iv },
    aesKey,
    new TextEncoder().encode(JSON.stringify(data))
  );
  return {
    iv: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(''),
    encrypted: Array.from(new Uint8Array(encrypted)).map(b => b.toString(16).padStart(2, '0')).join('')
  };
};

export { encryptRequest };