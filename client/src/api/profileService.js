import axios from 'axios';
import { AUTH_API_URL } from '../config';
import { decryptResponse } from '../utils/responseDecryption';

// Create a function to get the auth token
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Create an axios instance with auth header for JSON
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

// Create an axios instance with auth header for multipart/form-data
const authFormAxios = () => {
  const token = getAuthToken();
  const instance = axios.create({
    headers: {
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

// Get current user profile
export const getProfile = async () => {
  try {
    const api = authAxios();
    const response = await api.get(`${AUTH_API_URL}/me`);
    return response.data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error.response?.data || error.message;
  }
};

// Update user profile
export const updateProfile = async (profileData) => {
  try {
    const api = authAxios();
    const response = await api.put(`${AUTH_API_URL}/profile`, profileData);
    return response.data;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error.response?.data || error.message;
  }
};

// Upload profile picture
export const uploadProfilePicture = async (file) => {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    console.log('Uploading profile picture:', file.name, 'Size:', file.size, 'Type:', file.type);

    const formData = new FormData();
    formData.append('profilePicture', file);

    const api = authFormAxios();
    console.log('Sending profile picture upload request to:', `${AUTH_API_URL}/profile-picture`);
    const response = await api.post(`${AUTH_API_URL}/profile-picture`, formData);
    console.log('Profile picture upload response:', response.data);

    return response.data;
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw error.response?.data || error.message;
  }
};
