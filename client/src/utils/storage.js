/**
 * Secure storage utilities for client-side data persistence
 * Supports both localStorage (persistent) and sessionStorage (session-only)
 * with built-in encryption/decryption
 */

import CryptoJS from 'crypto-js';

// Storage keys
const STORAGE_KEYS = {
  TOKEN: 'secure_token',
  USER: 'secure_user',
  SESSION_DATA: 'secure_session_data',
  TEMP_DATA: 'secure_temp_data'
};

// Encryption key for storage (different from API keys)
const STORAGE_ENCRYPTION_KEY = 'secureFileStorageKey2024';

/**
 * Encrypts data for storage
 * @param {any} data - Data to encrypt
 * @returns {string} - Encrypted data as string
 */
const encryptData = (data) => {
  try {
    const jsonString = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(jsonString, STORAGE_ENCRYPTION_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('Error encrypting data:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypts data from storage
 * @param {string} encryptedData - Encrypted data string
 * @returns {any} - Decrypted data
 */
const decryptData = (encryptedData) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, STORAGE_ENCRYPTION_KEY);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedString);
  } catch (error) {
    console.error('Error decrypting data:', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Secure localStorage operations (persistent across browser sessions)
 */
export const secureLocalStorage = {
  /**
   * Store data in localStorage with encryption
   * @param {string} key - Storage key
   * @param {any} data - Data to store
   */
  setItem: (key, data) => {
    try {
      const encryptedData = encryptData(data);
      localStorage.setItem(key, encryptedData);
    } catch (error) {
      console.error('Error storing data in localStorage:', error);
      throw error;
    }
  },

  /**
   * Retrieve and decrypt data from localStorage
   * @param {string} key - Storage key
   * @returns {any|null} - Decrypted data or null if not found/error
   */
  getItem: (key) => {
    try {
      const encryptedData = localStorage.getItem(key);
      if (!encryptedData) return null;
      return decryptData(encryptedData);
    } catch (error) {
      console.error('Error retrieving data from localStorage:', error);
      // Clear corrupted data
      localStorage.removeItem(key);
      return null;
    }
  },

  /**
   * Remove item from localStorage
   * @param {string} key - Storage key
   */
  removeItem: (key) => {
    localStorage.removeItem(key);
  },

  /**
   * Clear all secure localStorage data
   */
  clear: () => {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
};

/**
 * Secure sessionStorage operations (cleared when browser tab closes)
 */
export const secureSessionStorage = {
  /**
   * Store data in sessionStorage with encryption
   * @param {string} key - Storage key
   * @param {any} data - Data to store
   */
  setItem: (key, data) => {
    try {
      const encryptedData = encryptData(data);
      sessionStorage.setItem(key, encryptedData);
    } catch (error) {
      console.error('Error storing data in sessionStorage:', error);
      throw error;
    }
  },

  /**
   * Retrieve and decrypt data from sessionStorage
   * @param {string} key - Storage key
   * @returns {any|null} - Decrypted data or null if not found/error
   */
  getItem: (key) => {
    try {
      const encryptedData = sessionStorage.getItem(key);
      if (!encryptedData) return null;
      return decryptData(encryptedData);
    } catch (error) {
      console.error('Error retrieving data from sessionStorage:', error);
      // Clear corrupted data
      sessionStorage.removeItem(key);
      return null;
    }
  },

  /**
   * Remove item from sessionStorage
   * @param {string} key - Storage key
   */
  removeItem: (key) => {
    sessionStorage.removeItem(key);
  },

  /**
   * Clear all secure sessionStorage data
   */
  clear: () => {
    Object.values(STORAGE_KEYS).forEach(key => {
      sessionStorage.removeItem(key);
    });
  }
};

/**
 * High-level storage functions for common use cases
 */
export const storage = {
  // Authentication data (persistent)
  setToken: (token) => secureLocalStorage.setItem(STORAGE_KEYS.TOKEN, token),
  getToken: () => secureLocalStorage.getItem(STORAGE_KEYS.TOKEN),
  removeToken: () => secureLocalStorage.removeItem(STORAGE_KEYS.TOKEN),

  setUser: (user) => secureLocalStorage.setItem(STORAGE_KEYS.USER, user),
  getUser: () => secureLocalStorage.getItem(STORAGE_KEYS.USER),
  removeUser: () => secureLocalStorage.removeItem(STORAGE_KEYS.USER),

  // Session data (temporary, cleared on tab close)
  setSessionData: (data) => secureSessionStorage.setItem(STORAGE_KEYS.SESSION_DATA, data),
  getSessionData: () => secureSessionStorage.getItem(STORAGE_KEYS.SESSION_DATA),
  removeSessionData: () => secureSessionStorage.removeItem(STORAGE_KEYS.SESSION_DATA),

  // Temporary data (can be either local or session based on use case)
  setTempData: (data, useSession = true) => {
    const storage = useSession ? secureSessionStorage : secureLocalStorage;
    storage.setItem(STORAGE_KEYS.TEMP_DATA, data);
  },
  getTempData: (useSession = true) => {
    const storage = useSession ? secureSessionStorage : secureLocalStorage;
    return storage.getItem(STORAGE_KEYS.TEMP_DATA);
  },
  removeTempData: (useSession = true) => {
    const storage = useSession ? secureSessionStorage : secureLocalStorage;
    storage.removeItem(STORAGE_KEYS.TEMP_DATA);
  },

  // Clear all stored data
  clearAll: () => {
    secureLocalStorage.clear();
    secureSessionStorage.clear();
  },

  // Clear authentication data only
  clearAuth: () => {
    secureLocalStorage.removeItem(STORAGE_KEYS.TOKEN);
    secureLocalStorage.removeItem(STORAGE_KEYS.USER);
  },

  // Clear session data only
  clearSession: () => {
    secureSessionStorage.clear();
  }
};

// Migration function to handle existing unencrypted data
const migrateLegacyData = () => {
  try {
    // Check for legacy unencrypted token
    const legacyToken = localStorage.getItem('token');
    if (legacyToken && !localStorage.getItem(STORAGE_KEYS.TOKEN)) {
      console.log('Migrating legacy token to encrypted storage');
      secureLocalStorage.setItem(STORAGE_KEYS.TOKEN, legacyToken);
      localStorage.removeItem('token'); // Remove legacy data
    }

    // Check for legacy unencrypted user data
    const legacyUser = localStorage.getItem('user');
    if (legacyUser && !localStorage.getItem(STORAGE_KEYS.USER)) {
      try {
        const userData = JSON.parse(legacyUser);
        console.log('Migrating legacy user data to encrypted storage');
        secureLocalStorage.setItem(STORAGE_KEYS.USER, userData);
        localStorage.removeItem('user'); // Remove legacy data
      } catch (e) {
        console.warn('Failed to parse legacy user data:', e);
        localStorage.removeItem('user');
      }
    }
  } catch (error) {
    console.warn('Error during data migration:', error);
  }
};

// Run migration on module load
migrateLegacyData();

// Export storage keys for external use
export { STORAGE_KEYS };