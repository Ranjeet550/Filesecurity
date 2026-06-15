import axios from 'axios';
import { storage } from '../utils/storage';
import { decryptResponse } from '../utils/responseDecryption';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Get auth token from storage utility
const getAuthToken = () => {
  return storage.getToken();
};

// Create axios instance with auth header
const authAxios = () => {
  const token = getAuthToken();
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  });
};

/**
 * Get all activities with pagination and filtering
 */
export const getActivities = async (params = {}) => {
  try {
    const defaultParams = {
      page: 1,
      limit: 20,
      ...params
    };
    
    const response = await authAxios().get('/activities', { params: defaultParams });
    
    // Decrypt response if encrypted
    let responseData = response.data;
    if (responseData.encrypted) {
      responseData = await decryptResponse(responseData.encrypted);
    }
    
    // Extract data array from the response structure
    const dataArray = Array.isArray(responseData?.data) ? responseData.data : (Array.isArray(responseData) ? responseData : []);
    
    return {
      data: dataArray,
      pagination: responseData?.pagination,
      success: responseData?.success
    };
  } catch (error) {
    console.error('Activity fetch error:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch activities');
  }
};

/**
 * Get activity by ID
 */
export const getActivityById = async (id) => {
  try {
    const response = await authAxios().get(`/activities/${id}`);
    return response.data?.data || response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch activity');
  }
};

/**
 * Get activity statistics
 */
export const getActivityStats = async (params = {}) => {
  try {
    const defaultParams = {
      days: 30,
      ...params
    };
    
    const response = await authAxios().get('/activities/stats', { params: defaultParams });
    
    // Decrypt response if encrypted
    let responseData = response.data;
    if (responseData.encrypted) {
      responseData = await decryptResponse(responseData.encrypted);
    }
    
    return responseData?.data || responseData;
  } catch (error) {
    console.error('Stats fetch error:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch activity statistics');
  }
};

/**
 * Export activities to CSV/Excel
 * @param {Object} params - Query parameters for filtering
 */
export const exportActivities = async (params = {}) => {
  try {
    const response = await authAxios().get('/activities/export', {
      params,
      responseType: 'blob'
    });
    
    // Create blob link and trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `activities-${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    
    return true;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to export activities');
  }
};

/**
 * Get system logs (server startup, errors, etc.)
 */
export const getSystemLogs = async (params = {}) => {
  try {
    const defaultParams = {
      page: 1,
      limit: 20,
      ...params
    };
    
    const response = await authAxios().get('/activities/system/logs', { params: defaultParams });
    
    // Decrypt response if encrypted
    let responseData = response.data;
    if (responseData.encrypted) {
      responseData = await decryptResponse(responseData.encrypted);
    }
    
    // Extract data array
    const dataArray = Array.isArray(responseData?.data) ? responseData.data : (Array.isArray(responseData) ? responseData : []);
    
    return {
      data: dataArray,
      pagination: responseData?.pagination,
      success: responseData?.success
    };
  } catch (error) {
    console.error('System logs fetch error:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch system logs');
  }
};

/**
 * Get user activity timeline for a specific user
 */
export const getUserActivityTimeline = async (userId, params = {}) => {
  try {
    const response = await authAxios().get(`/activities/user/${userId}/timeline`, { params });
    
    // Decrypt response if encrypted
    let responseData = response.data;
    if (responseData.encrypted) {
      responseData = await decryptResponse(responseData.encrypted);
    }
    
    return responseData?.data || responseData;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch user timeline');
  }
};

/**
 * Clear old activities (admin only)
 */
export const clearOldActivities = async (daysOld = 90) => {
  try {
    const response = await authAxios().delete('/activities/clear', {
      data: { daysOld }
    });
    
    // Decrypt response if encrypted
    let responseData = response.data;
    if (responseData.encrypted) {
      responseData = await decryptResponse(responseData.encrypted);
    }
    
    return responseData?.data || responseData;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to clear old activities');
  }
};
