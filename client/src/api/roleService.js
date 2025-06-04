import axios from 'axios';
import { API_BASE_URL } from '../config';

const ROLES_API_URL = `${API_BASE_URL}/roles`;

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

// Get all roles
export const getRoles = async () => {
  try {
    const api = authAxios();
    const response = await api.get(ROLES_API_URL);
    return response.data;
  } catch (error) {
    console.error('Error fetching roles:', error);
    throw error.response?.data || error.message;
  }
};

// Get role by ID
export const getRoleById = async (roleId) => {
  try {
    const api = authAxios();
    const response = await api.get(`${ROLES_API_URL}/${roleId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching role by ID:', error);
    throw error.response?.data || error.message;
  }
};

// Create role
export const createRole = async (roleData) => {
  try {
    const api = authAxios();
    const response = await api.post(ROLES_API_URL, roleData);
    return response.data;
  } catch (error) {
    console.error('Error creating role:', error);
    throw error.response?.data || error.message;
  }
};

// Update role
export const updateRole = async (roleId, roleData) => {
  try {
    const api = authAxios();
    const response = await api.put(`${ROLES_API_URL}/${roleId}`, roleData);
    return response.data;
  } catch (error) {
    console.error('Error updating role:', error);
    throw error.response?.data || error.message;
  }
};

// Delete role
export const deleteRole = async (roleId) => {
  try {
    const api = authAxios();
    const response = await api.delete(`${ROLES_API_URL}/${roleId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting role:', error);
    throw error.response?.data || error.message;
  }
};
