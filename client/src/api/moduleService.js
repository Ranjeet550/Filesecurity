import axios from 'axios';
import { API_BASE_URL } from '../config';

const MODULES_API_URL = `${API_BASE_URL}/modules`;

// Create a function to get the auth token
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Create an axios instance with auth header
const authAxios = () => {
  const token = getAuthToken();
  return axios.create({
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    }
  });
};

// Get all modules
export const getModules = async () => {
  try {
    const api = authAxios();
    const response = await api.get(MODULES_API_URL);
    return response.data;
  } catch (error) {
    console.error('Error fetching modules:', error);
    throw error.response?.data || error.message;
  }
};

// Get module by ID
export const getModuleById = async (moduleId) => {
  try {
    const api = authAxios();
    const response = await api.get(`${MODULES_API_URL}/${moduleId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching module by ID:', error);
    throw error.response?.data || error.message;
  }
};

// Create module
export const createModule = async (moduleData) => {
  try {
    const api = authAxios();
    const response = await api.post(MODULES_API_URL, moduleData);
    return response.data;
  } catch (error) {
    console.error('Error creating module:', error);
    throw error.response?.data || error.message;
  }
};

// Update module
export const updateModule = async (moduleId, moduleData) => {
  try {
    const api = authAxios();
    const response = await api.put(`${MODULES_API_URL}/${moduleId}`, moduleData);
    return response.data;
  } catch (error) {
    console.error('Error updating module:', error);
    throw error.response?.data || error.message;
  }
};

// Delete module
export const deleteModule = async (moduleId) => {
  try {
    const api = authAxios();
    const response = await api.delete(`${MODULES_API_URL}/${moduleId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting module:', error);
    throw error.response?.data || error.message;
  }
};
