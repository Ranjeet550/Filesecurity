import axios from 'axios';
import { USERS_API_URL } from '../config';
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

// Get all users
export const getUsers = async () => {
  try {
    const api = authAxios();
    const response = await api.get(USERS_API_URL);
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error.response?.data || error.message;
  }
};

// Get user by ID
export const getUserById = async (userId) => {
  try {
    const api = authAxios();
    const response = await api.get(`${USERS_API_URL}/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    throw error.response?.data || error.message;
  }
};

// Create user
export const createUser = async (userData) => {
  try {
    const api = authAxios();
    const response = await api.post(USERS_API_URL, userData);
    return response.data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error.response?.data || error.message;
  }
};

// Update user
export const updateUser = async (userId, userData) => {
  try {
    const api = authAxios();
    const response = await api.put(`${USERS_API_URL}/${userId}`, userData);
    return response.data;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error.response?.data || error.message;
  }
};

// Delete user
export const deleteUser = async (userId) => {
  try {
    const api = authAxios();
    const response = await api.delete(`${USERS_API_URL}/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error.response?.data || error.message;
  }
};

// Change user password (Admin only)
export const changeUserPassword = async (userId, password) => {
  try {
    const api = authAxios();
    const response = await api.put(`${USERS_API_URL}/${userId}/password`, { password });
    return response.data;
  } catch (error) {
    console.error('Error changing user password:', error);
    throw error.response?.data || error.message;
  }
};
