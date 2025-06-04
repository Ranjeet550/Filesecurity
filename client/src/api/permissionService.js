import axios from 'axios';
import { API_BASE_URL } from '../config';

const PERMISSIONS_API_URL = `${API_BASE_URL}/permissions`;

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

// Get all permissions
export const getPermissions = async () => {
  try {
    const api = authAxios();
    const response = await api.get(PERMISSIONS_API_URL);
    return response.data;
  } catch (error) {
    console.error('Error fetching permissions:', error);
    throw error.response?.data || error.message;
  }
};

// Get permissions by module
export const getPermissionsByModule = async (moduleId) => {
  try {
    const api = authAxios();
    const response = await api.get(`${PERMISSIONS_API_URL}/module/${moduleId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching permissions by module:', error);
    throw error.response?.data || error.message;
  }
};

// Get permission by ID
export const getPermissionById = async (permissionId) => {
  try {
    const api = authAxios();
    const response = await api.get(`${PERMISSIONS_API_URL}/${permissionId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching permission by ID:', error);
    throw error.response?.data || error.message;
  }
};

// Create permission
export const createPermission = async (permissionData) => {
  try {
    const api = authAxios();
    const response = await api.post(PERMISSIONS_API_URL, permissionData);
    return response.data;
  } catch (error) {
    console.error('Error creating permission:', error);
    throw error.response?.data || error.message;
  }
};

// Update permission
export const updatePermission = async (permissionId, permissionData) => {
  try {
    const api = authAxios();
    const response = await api.put(`${PERMISSIONS_API_URL}/${permissionId}`, permissionData);
    return response.data;
  } catch (error) {
    console.error('Error updating permission:', error);
    throw error.response?.data || error.message;
  }
};

// Delete permission
export const deletePermission = async (permissionId) => {
  try {
    const api = authAxios();
    const response = await api.delete(`${PERMISSIONS_API_URL}/${permissionId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting permission:', error);
    throw error.response?.data || error.message;
  }
};
