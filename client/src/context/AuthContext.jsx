import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { getLocationData } from '../api/fileService';
import { updateProfile, uploadProfilePicture, getProfile } from '../api/profileService';
import { getSessionTimeout, getActivityTimeout } from '../api/settingsService';
import { AUTH_API_URL } from '../config';
import { decryptResponse } from '../utils/responseDecryption';
import { encryptRequest } from '../utils/requestEncryption';
import { storage } from '../utils/storage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
   const [user, setUser] = useState(null);
   const [token, setToken] = useState(storage.getToken() || null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);
   const [sessionExpired, setSessionExpired] = useState(false);
   const [lastActivity, setLastActivity] = useState(Date.now());
   const [sessionTimeout, setSessionTimeout] = useState(0);
   const [inactivityTimeout, setInactivityTimeout] = useState(0);
   const profileFetchedRef = useRef(false);

  // Activity tracking function
  const updateActivity = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  // Fetch session settings
        const fetchSessionSettings = useCallback(async () => {
          try {
            const [sessionRes, activityRes] = await Promise.all([
              getSessionTimeout(),
              getActivityTimeout()
            ]);
            const sessionMin = sessionRes.data?.value;
            const activityMin = activityRes.data?.value;
            if (sessionMin && activityMin) {
              const sessionMs = sessionMin * 60 * 1000;
              const activityMs = activityMin * 60 * 1000;
              setSessionTimeout(sessionMs);
              setInactivityTimeout(activityMs);
              return { sessionTimeout: sessionMs, inactivityTimeout: activityMs };
            } else {
              throw new Error('Invalid session settings received');
            }
          } catch (error) {
            console.error('Error fetching session settings:', error);
            // Set minimal fallback to prevent logout
            const fallbackSession = 1440 * 60 * 1000; // 24 hours
            const fallbackActivity = 60 * 60 * 1000; // 1 hour
            setSessionTimeout(fallbackSession);
            setInactivityTimeout(fallbackActivity);
            return { sessionTimeout: fallbackSession, inactivityTimeout: fallbackActivity };
          }
        }, []);
  
  // Session validation function
        const validateSession = useCallback((customSessionTimeout, customInactivityTimeout) => {
          const now = Date.now();
          const sessionStart = storage.getSessionData()?.startTime || now;
          const timeSinceLogin = now - sessionStart;
          const timeSinceActivity = now - lastActivity;
  
          const effectiveSessionTimeout = customSessionTimeout || sessionTimeout;
          const effectiveInactivityTimeout = customInactivityTimeout || inactivityTimeout;
  
          // Check session timeout
          if (timeSinceLogin > effectiveSessionTimeout) {
            handleSessionExpiry(`Session expired after ${Math.floor(effectiveSessionTimeout / (60 * 1000))} minutes`);
            return false;
          }
  
          // Check inactivity timeout
          if (timeSinceActivity > effectiveInactivityTimeout) {
            handleSessionExpiry(`Session expired due to inactivity (${Math.floor(effectiveInactivityTimeout / (60 * 1000))} minutes)`);
            return false;
          }
  
          return true;
        }, [lastActivity, sessionTimeout, inactivityTimeout]);

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

  // Fetch settings on mount and when token exists
     useEffect(() => {
       if (token) {
         fetchSessionSettings();
       }
     }, [token, fetchSessionSettings]);
  
  // Listen for settings updates
     useEffect(() => {
       const handleSettingsUpdate = (event) => {
         if (event.detail.type === 'sessionSettings') {
           setSessionTimeout(event.detail.sessionTimeout * 60 * 1000);
           setInactivityTimeout(event.detail.activityTimeout * 60 * 1000);
         }
       };
  
       window.addEventListener('settingsUpdated', handleSettingsUpdate);
       return () => window.removeEventListener('settingsUpdated', handleSettingsUpdate);
     }, []);
  
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
            if (!token || profileFetchedRef.current) {
              setLoading(false);
              return;
            }
  
            // Fetch settings first
            const settings = await fetchSessionSettings();
  
            // Validate session on load with fetched settings
            if (!validateSession(settings.sessionTimeout, settings.inactivityTimeout)) {
              setLoading(false);
              return;
            }
  
            try {
              profileFetchedRef.current = true;
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
        }, [token, validateSession, fetchSessionSettings]);

  // Register user
  const register = async (userData, locationData) => {
    try {
      setLoading(true);
      setError(null);

      // Use provided location data or get it if not provided
      const location = locationData || await getLocationData();

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
  const login = async (email, password, locationData) => {
    try {
      setLoading(true);
      setError(null);

      // Use provided location data or get it if not provided
      const location = locationData || await getLocationData();

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
    // Clear location data from localStorage on logout
    localStorage.removeItem('userLocation');
    setToken(null);
    setUser(null);
    setSessionExpired(false);
    profileFetchedRef.current = false; // Reset the flag on logout
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
