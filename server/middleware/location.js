// Middleware to extract location information from request
// In a real application, you would use a geolocation service API
// For this example, we'll use a simplified approach

exports.trackLocation = async (req, res, next) => {
  try {
    console.log('Location middleware called');
    console.log('Request method:', req.method);
    console.log('Request path:', req.path);

    // Default location if not provided
    const defaultLocation = {
      latitude: 0,
      longitude: 0,
      city: 'Unknown',
      country: 'Unknown'
    };

    // Check if request body is encrypted
    let requestBody = req.body;
    if (req.body && req.body.encrypted) {
      try {
        // Import decryptRequest here to avoid circular dependencies
        const { decryptRequest } = require('../utils/responseEncryption');
        requestBody = decryptRequest(req.body.encrypted);
        console.log('Decrypted request body for location extraction');
      } catch (decryptError) {
        console.error('Failed to decrypt request for location:', decryptError);
        requestBody = req.body; // Fallback to encrypted body
      }
    }

    console.log('Processing location from body:', requestBody);

    // In a real app, you would use IP-based geolocation or client-provided coordinates
    // Check for location in different parts of the request
    let locationData;

    // Check in requestBody.location (JSON data)
    if (requestBody && requestBody.location) {
      console.log('Found location in requestBody.location:', requestBody.location);
      locationData = requestBody.location;
    }
    // Check in requestBody directly (form data)
    else if (requestBody && (requestBody.latitude !== undefined || requestBody.longitude !== undefined)) {
      console.log('Found location in requestBody directly');
      locationData = {
        latitude: parseFloat(requestBody.latitude) || 0,
        longitude: parseFloat(requestBody.longitude) || 0,
        city: requestBody.city || 'Unknown',
        country: requestBody.country || 'Unknown'
      };
    }
    // Check in req.query (URL parameters)
    else if (req.query && (req.query.latitude !== undefined || req.query.longitude !== undefined)) {
      console.log('Found location in req.query');
      locationData = {
        latitude: parseFloat(req.query.latitude) || 0,
        longitude: parseFloat(req.query.longitude) || 0,
        city: req.query.city || 'Unknown',
        country: req.query.country || 'Unknown'
      };
    }

    // If location data is provided and valid, attach it to the request
    if (locationData && (locationData.latitude !== undefined || locationData.longitude !== undefined)) {
      req.userLocation = {
        latitude: parseFloat(locationData.latitude) || 0,
        longitude: parseFloat(locationData.longitude) || 0,
        city: locationData.city || 'Unknown',
        country: locationData.country || 'Unknown'
      };

      console.log('Location data received:', req.userLocation);
    } else {
      // Use default location
      req.userLocation = defaultLocation;
      console.log('Using default location data');
    }

    next();
  } catch (error) {
    console.error('Error processing location data:', error);
    // If there's an error, continue without location tracking
    req.userLocation = {
      latitude: 0,
      longitude: 0,
      city: 'Unknown',
      country: 'Unknown'
    };
    next();
  }
};
