import { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { getLocationData } from '../api/fileService';
import { updateProfile, uploadProfilePicture, getProfile } from '../api/profileService';
import { AUTH_API_URL } from '../config';
import { decryptResponse } from '../utils/responseDecryption';
import { encryptRequest } from '../utils/requestEncryption';
import { storage } from '../utils/storage';

const AuthContext = createContext();

// Session timeout constants (in milliseconds)
const SESSION_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours
const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export const AuthProvider = ({ children }) => {
   const [user, setUser] = useState(null);
   const [token, setToken] = useState(storage.getToken() || null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);
   const [sessionExpired, setSessionExpired] = useState(false);
   const [lastActivity, setLastActivity] = useState(Date.now());

  // Activity tracking function
  const updateActivity = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  // Session validation function
  const validateSession = useCallback(() => {
    const now = Date.now();
    const sessionStart = storage.getSessionData()?.startTime || now;
    const timeSinceLogin = now - sessionStart;
    const timeSinceActivity = now - lastActivity;

    // Check session timeout (2 hours)
    if (timeSinceLogin > SESSION_TIMEOUT) {
      handleSessionExpiry('Session expired after 2 hours');
      return false;
    }

    // Check inactivity timeout (5 minutes)
    if (timeSinceActivity > INACTIVITY_TIMEOUT) {
      handleSessionExpiry('Session expired due to inactivity (5 minutes)');
      return false;
    }

    return true;
  }, [lastActivity]);

  // Handle session expiry
  const handleSessionExpiry = useCallback((reason) => {
    console.log('Session expired:', reason);
    setSessionExpired(true);
    storage.clearAuth();
    storage.clearSession();
    setToken(null);
    setUser(null);
    setError(reason);
  }, []);

  // Activity event listeners
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      updateActivity();
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [updateActivity]);

  // Session validation interval
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      if (!validateSession()) {
        clearInterval(interval);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [token, validateSession]);

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

      // Validate session on load
      if (!validateSession()) {
        setLoading(false);
        return;
      }

      try {
        const res = await getProfile();
        setUser(res.data);
        storage.setUser(res.data);

        // Initialize session data if not exists
        if (!storage.getSessionData()) {
          storage.setSessionData({
            startTime: Date.now(),
            lastActivity: Date.now()
          });
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading user:', err);
        storage.clearAuth();
        storage.clearSession();
        setToken(null);
        setUser(null);
        setError('Authentication error. Please login again.');
        setLoading(false);
      }
    };

    loadUser();
  }, [token, validateSession]);

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

      // Encrypt the request data
      const encryptedData = await encryptRequest(requestData);

      const res = await axios.post(`${AUTH_API_URL}/register`, encryptedData);

      // Decrypt if encrypted
      let responseData = res.data;
      if (responseData.encrypted) {
        responseData = await decryptResponse(responseData.encrypted);
      }

      storage.setToken(responseData.token);
      storage.setUser(responseData.user);
      setToken(responseData.token);
      setUser(responseData.user);

      // Initialize session data
      storage.setSessionData({
        startTime: Date.now(),
        lastActivity: Date.now()
      });

      setLastActivity(Date.now());
      setSessionExpired(false);
      setLoading(false);
      return responseData;
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

      // Encrypt the request data
      const encryptedData = await encryptRequest(requestData);

      const res = await axios.post(`${AUTH_API_URL}/login`, encryptedData);

      // Decrypt if encrypted
      let responseData = res.data;
      if (responseData.encrypted) {
        responseData = await decryptResponse(responseData.encrypted);
      }

      storage.setToken(responseData.token);
      storage.setUser(responseData.user);
      setToken(responseData.token);
      setUser(responseData.user);

      // Initialize session data
      storage.setSessionData({
        startTime: Date.now(),
        lastActivity: Date.now()
      });

      setLastActivity(Date.now());
      setSessionExpired(false);
      setLoading(false);
      return responseData;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      setLoading(false);
      throw err;
    }
  };

  // Logout user
  const logout = () => {
    storage.clearAuth();
    storage.clearSession(); // Clear any session data on logout
    setToken(null);
    setUser(null);
    setSessionExpired(false);
  };

  // Update user profile
  const updateUserProfile = async (profileData) => {
    try {
      setLoading(true);
      setError(null);

      const res = await updateProfile(profileData);
      console.log('Profile update response:', res);

      // Update user state and secure storage
      if (res && res.data && res.data.data) {
        setUser(res.data.data);
        storage.setUser(res.data.data);
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
        storage.setUser(res.data.data);
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
        sessionExpired,
        register,
        login,
        logout,
        updateUserProfile,
        uploadUserProfilePicture,
        setError,
        validateSession,
        updateActivity
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
