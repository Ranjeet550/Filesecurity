import axios from 'axios';
import { SETTINGS_API_URL } from '../config';
import { decryptResponse } from '../utils/responseDecryption';
import { storage } from '../utils/storage';

// Create a function to get the auth token
const getAuthToken = () => {
  return storage.getToken();
};

// Create an axios instance with auth header
const authAxios = () => {
  const token = getAuthToken();
  const instance = axios.create({
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    }
  });

  // Add response interceptor for decryption
  instance.interceptors.response.use(
    async (response) => {
      if (response.data && response.data.encrypted) {
        response.data = await decryptResponse(response.data.encrypted);
      }
      return response;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  return instance;
};

// Get download limit setting
export const getDownloadLimit = async () => {
  try {
    const api = authAxios();
    const response = await api.get(`${SETTINGS_API_URL}/download-limit`);
    return response.data;
  } catch (error) {
    console.error('Error fetching download limit:', error);
    throw error.response?.data || error.message;
  }
};

// Set download limit setting
export const setDownloadLimit = async (limit) => {
  try {
    const api = authAxios();
    const response = await api.put(`${SETTINGS_API_URL}/download-limit`, { value: limit });
    return response.data;
  } catch (error) {
    console.error('Error setting download limit:', error);
    throw error.response?.data || error.message;
  }
};

// Get all settings (admin only)
export const getAllSettings = async () => {
  try {
    const api = authAxios();
    const response = await api.get(SETTINGS_API_URL);
    return response.data;
  } catch (error) {
    console.error('Error fetching settings:', error);
    throw error.response?.data || error.message;
  }
};

// Upload group image
export const uploadGroupImage = async (groupName, imageFile) => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);

    const api = authAxios();
    const response = await api.post(`${SETTINGS_API_URL}/group-image/${groupName}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading group image:', error);
    throw error.response?.data || error.message;
  }
};

// Delete group image
export const deleteGroupImage = async (groupName) => {
  try {
    const api = authAxios();
    const response = await api.delete(`${SETTINGS_API_URL}/group-image/${groupName}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting group image:', error);
    throw error.response?.data || error.message;
  }
};

// Get session timeout setting
export const getSessionTimeout = async () => {
  try {
    const api = authAxios();
    const response = await api.get(`${SETTINGS_API_URL}/session-timeout`);
    return response.data;
  } catch (error) {
    console.error('Error fetching session timeout:', error);
    throw error.response?.data || error.message;
  }
};

// Set session timeout setting
export const setSessionTimeout = async (timeout) => {
  try {
    const api = authAxios();
    const response = await api.put(`${SETTINGS_API_URL}/session-timeout`, { value: timeout });
    return response.data;
  } catch (error) {
    console.error('Error setting session timeout:', error);
    throw error.response?.data || error.message;
  }
};

// Get activity timeout setting
export const getActivityTimeout = async () => {
  try {
    const api = authAxios();
    const response = await api.get(`${SETTINGS_API_URL}/activity-timeout`);
    return response.data;
  } catch (error) {
    console.error('Error fetching activity timeout:', error);
    throw error.response?.data || error.message;
  }
};

// Set activity timeout setting
export const setActivityTimeout = async (timeout) => {
  try {
    const api = authAxios();
    const response = await api.put(`${SETTINGS_API_URL}/activity-timeout`, { value: timeout });
    return response.data;
  } catch (error) {
    console.error('Error setting activity timeout:', error);
    throw error.response?.data || error.message;
  }
};

// Get all group images
export const getAllGroupImages = async () => {
  try {
    const api = authAxios();
    const response = await api.get(`${SETTINGS_API_URL}/group-images`);
    return response.data;
  } catch (error) {
    console.error('Error fetching group images:', error);
    throw error.response?.data || error.message;
  }
};