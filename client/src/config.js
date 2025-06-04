// Configuration file for environment variables

// API URLs
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const AUTH_API_URL = `${API_BASE_URL}/auth`;
export const FILES_API_URL = `${API_BASE_URL}/files`;
export const USERS_API_URL = `${API_BASE_URL}/users`;

// Other configuration
export const APP_NAME = 'Secure File Transfer';
// Unlimited storage - no storage limits
