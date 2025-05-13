// Middleware to extract location information from request
// In a real application, you would use a geolocation service API
// For this example, we'll use a simplified approach

exports.trackLocation = async (req, res, next) => {
  try {
    console.log('Location middleware called');
    console.log('Request body:', req.body);
    console.log('Request method:', req.method);
    console.log('Request path:', req.path);

    // Default location if not provided
    const defaultLocation = {
      latitude: 0,
      longitude: 0,
      city: 'Unknown',
      country: 'Unknown'
    };

    // In a real app, you would use IP-based geolocation or client-provided coordinates
    // Check for location in different parts of the request
    let locationData;

    // Check in req.body.location (JSON data)
    if (req.body && req.body.location) {
      console.log('Found location in req.body.location:', req.body.location);
      locationData = req.body.location;
    }
    // Check in req.body directly (form data)
    else if (req.body && (req.body.latitude || req.body.longitude)) {
      console.log('Found location in req.body directly');
      locationData = {
        latitude: parseFloat(req.body.latitude) || 0,
        longitude: parseFloat(req.body.longitude) || 0,
        city: req.body.city || 'Unknown',
        country: req.body.country || 'Unknown'
      };
    }
    // Check in req.query (URL parameters)
    else if (req.query && (req.query.latitude || req.query.longitude)) {
      console.log('Found location in req.query');
      locationData = {
        latitude: parseFloat(req.query.latitude) || 0,
        longitude: parseFloat(req.query.longitude) || 0,
        city: req.query.city || 'Unknown',
        country: req.query.country || 'Unknown'
      };
    }

    // If location data is provided and valid, attach it to the request
    if (locationData && (locationData.latitude || locationData.longitude)) {
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
