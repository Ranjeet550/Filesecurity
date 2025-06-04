import { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { getLocationData } from '../api/fileService';
import { updateProfile, uploadProfilePicture } from '../api/profileService';
import { AUTH_API_URL } from '../config';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set axios default headers
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Load user data if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`${AUTH_API_URL}/me`);
        setUser(res.data.data);
        localStorage.setItem('user', JSON.stringify(res.data.data));
        setLoading(false);
      } catch (err) {
        console.error('Error loading user:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        setError('Authentication error. Please login again.');
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  // Register user
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      // Get location data using our utility function
      const location = await getLocationData();

      // Add location data to the request
      const requestData = {
        ...userData,
        latitude: location.latitude,
        longitude: location.longitude,
        city: location.city,
        country: location.country
      };

      const res = await axios.post(`${AUTH_API_URL}/register`, requestData);

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setToken(res.data.token);
      setUser(res.data.user);
      setLoading(false);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      setLoading(false);
      throw err;
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      // Get location data using our utility function
      const location = await getLocationData();

      // Add location data to the request
      const requestData = {
        email,
        password,
        latitude: location.latitude,
        longitude: location.longitude,
        city: location.city,
        country: location.country
      };

      const res = await axios.post(`${AUTH_API_URL}/login`, requestData);

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setToken(res.data.token);
      setUser(res.data.user);
      setLoading(false);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      setLoading(false);
      throw err;
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  // Update user profile
  const updateUserProfile = async (profileData) => {
    try {
      setLoading(true);
      setError(null);

      const res = await updateProfile(profileData);
      console.log('Profile update response:', res);

      // Update user state and localStorage
      if (res && res.data && res.data.data) {
        setUser(res.data.data);
        localStorage.setItem('user', JSON.stringify(res.data.data));
        console.log('User state updated:', res.data.data);
      }

      setLoading(false);
      return res.data;
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.message || 'Failed to update profile');
      setLoading(false);
      throw err;
    }
  };

  // Upload profile picture
  const uploadUserProfilePicture = async (file) => {
    try {
      setLoading(true);
      setError(null);

      const res = await uploadProfilePicture(file);
      console.log('Profile picture upload response:', res);

      // Update user state with complete user data from response
      if (res && res.data && res.data.data) {
        setUser(res.data.data);
        localStorage.setItem('user', JSON.stringify(res.data.data));
        console.log('User state updated with new profile picture:', res.data.data);
      } else {
        console.error('Invalid response structure:', res);
      }

      setLoading(false);
      return res.data;
    } catch (err) {
      console.error('Profile picture upload error:', err);
      setError(err.message || 'Failed to upload profile picture');
      setLoading(false);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        register,
        login,
        logout,
        updateUserProfile,
        uploadUserProfilePicture,
        setError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
