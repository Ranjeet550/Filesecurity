// Accept file (viewer marks as accepted)
export const acceptFile = async (fileId) => {
  try {
    const api = authAxios();
    const response = await api.post(`${FILES_API_URL}/${fileId}/accept`);
    return response.data;
  } catch (error) {
    console.error('Error accepting file:', error);
    throw error.response?.data || error.message;
  }
};
// Assign file to users (admin only)
export const assignFileToUsers = async (fileId, userIds) => {
  try {
    const api = authAxios();
    const response = await api.post(`${FILES_API_URL}/${fileId}/assign`, { userIds });
    return response.data;
  } catch (error) {
    console.error('Error assigning file to users:', error);
    throw error.response?.data || error.message;
  }
};
import axios from 'axios';
import { FILES_API_URL } from '../config';

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

// Get location data
export const getLocationData = async () => {
  // Default location data when geolocation is not available
  const defaultLocation = {
    latitude: 0,
    longitude: 0,
    city: 'Unknown',
    country: 'Unknown'
  };

  // Check if we have cached location data to avoid repeated permission prompts
  const cachedLocation = localStorage.getItem('userLocation');
  if (cachedLocation) {
    try {
      const parsedLocation = JSON.parse(cachedLocation);
      // Only use cached location if it's not the default (which means permission was granted before)
      if (parsedLocation.latitude !== 0 || parsedLocation.longitude !== 0) {
        return parsedLocation;
      }
    } catch (e) {
      // Ignore parse errors and continue with geolocation request
    }
  }

  try {
    // Check if geolocation is available in the browser
    if (!navigator.geolocation) {
      console.log('Geolocation is not supported by this browser');
      return defaultLocation;
    }

    // Try to get position with a timeout
    const position = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Geolocation request timed out'));
      }, 5000);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(timeout);
          resolve(pos);
        },
        (err) => {
          clearTimeout(timeout);
          reject(err);
        },
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 0
        }
      );
    });

    // Create location object with coordinates
    const locationData = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      city: 'Unknown', // In a real app, you would use a reverse geocoding service
      country: 'Unknown'
    };

    // Cache the location data to avoid repeated permission prompts
    localStorage.setItem('userLocation', JSON.stringify(locationData));

    return locationData;
  } catch (err) {
    console.log('Using default location data:', err.message);

    // Cache the default location to avoid repeated permission prompts
    // Only if the error is a permission denied error
    if (err.code === 1) { // 1 = PERMISSION_DENIED
      localStorage.setItem('userLocation', JSON.stringify(defaultLocation));
    }

    return defaultLocation;
  }
};

// Upload file
export const uploadFile = async (file) => {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    console.log('Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);

    const location = await getLocationData();
    const token = getAuthToken();

    const formData = new FormData();
    formData.append('file', file);

    // Add password if provided
    if (file.password) {
      formData.append('password', file.password);
      console.log('Password included in upload:', file.password);
    }

    // Add location data to the form data
    formData.append('latitude', location.latitude.toString());
    formData.append('longitude', location.longitude.toString());
    formData.append('city', location.city);
    formData.append('country', location.country);

    // Log the form data for debugging
    console.log('FormData contents:');
    for (let [key, value] of formData.entries()) {
      console.log(`Form data: ${key} = ${value instanceof File ? value.name : value}`);
    }
    
    // Also log the file object to see if password is attached
    console.log('File object being uploaded:', {
      name: file.name,
      size: file.size,
      type: file.type,
      hasPassword: !!file.password,
      password: file.password
    });

    const response = await axios.post(`${FILES_API_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });

    return response.data;
  } catch (error) {
    console.error('Upload error details:', error);
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Server error response:', error.response.data);
      throw error.response.data || { message: 'Server error' };
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from server');
      throw { message: 'No response from server. Please check your connection.' };
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
      throw { message: error.message || 'Error uploading file' };
    }
  }
};

// Get all files
export const getFiles = async () => {
  try {
    const api = authAxios();
    const response = await api.get(FILES_API_URL);
    return response.data;
  } catch (error) {
    console.error('Error fetching files:', error);
    throw error.response?.data || error.message;
  }
};

// Get file by ID
export const getFileById = async (fileId) => {
  try {
    const api = authAxios();
    const response = await api.get(`${FILES_API_URL}/${fileId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching file by ID:', error);
    throw error.response?.data || error.message;
  }
};

// Download file
export const downloadFile = async (fileId, password) => {
  try {
    const location = await getLocationData();
    const token = getAuthToken();

    // Create request data with password and location
    const requestData = {
      password,
      latitude: location.latitude,
      longitude: location.longitude,
      city: location.city,
      country: location.country
    };

    const response = await axios.post(
      `${FILES_API_URL}/${fileId}/download`,
      requestData,
      {
        responseType: 'blob',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      }
    );

    // Get the content type from the response
    const contentType = response.headers['content-type'] || 'application/octet-stream';
    console.log('Response content type:', contentType);

    // Create a blob with the correct MIME type
    const blob = new Blob([response.data], { type: contentType });

    // Create a download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    // Get filename from header if available
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'download';

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch && filenameMatch.length === 2) {
        filename = filenameMatch[1];
      }
    }

    // Set download attribute to force download instead of navigation
    link.setAttribute('download', filename);

    // Make the link invisible
    link.style.display = 'none';

    // Add to document, trigger click, and remove immediately
    document.body.appendChild(link);

    // Create a MouseEvent instead of using click()
    // This gives us more control over the event behavior
    const clickEvent = new MouseEvent('click', {
      view: window,
      bubbles: false,
      cancelable: true
    });

    // Use setTimeout with 0ms to ensure it happens in the next event loop
    // This helps prevent browser navigation
    setTimeout(() => {
      // Dispatch the event instead of using click()
      const clickResult = link.dispatchEvent(clickEvent);
      console.log('Click event dispatched, result:', clickResult);

      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        link.remove();
        console.log('Download link removed and URL revoked');
      }, 100);
    }, 0);

    return true;
  } catch (error) {
    console.error('Download error details:', error);
    if (error.response) {
      throw error.response.data || { message: 'Server error' };
    } else if (error.request) {
      throw { message: 'No response from server. Please check your connection.' };
    } else {
      throw { message: error.message || 'Error downloading file' };
    }
  }
};

// Delete file
export const deleteFile = async (fileId) => {
  try {
    const api = authAxios();
    const response = await api.delete(`${FILES_API_URL}/${fileId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error.response?.data || error.message;
  }
};

// Get file password for sharing
export const getFilePassword = async (fileId) => {
  try {
    const api = authAxios();
    const response = await api.get(`${FILES_API_URL}/${fileId}/password`);
    return response.data;
  } catch (error) {
    console.error('Error getting file password:', error);
    throw error.response?.data || error.message;
  }
};
