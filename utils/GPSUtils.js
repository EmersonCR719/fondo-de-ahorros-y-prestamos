import * as Location from 'expo-location';

export const requestLocationPermission = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
};

export const getCurrentLocation = async () => {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
    };
  } catch (error) {
    console.error('Error getting location:', error);
    throw error;
  }
};

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radio de la Tierra en kilómetros
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distancia en kilómetros
  return distance * 1000; // Convertir a metros
};

export const validateLocationForSavings = async (requiredLocation = null) => {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      throw new Error('Permisos de ubicación denegados');
    }

    const currentLocation = await getCurrentLocation();

    // Si no se requiere una ubicación específica, solo validar que se obtuvo la ubicación
    if (!requiredLocation) {
      return {
        valid: true,
        location: currentLocation,
        message: 'Ubicación obtenida correctamente',
      };
    }

    // Calcular distancia a la ubicación requerida
    const distance = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      requiredLocation.latitude,
      requiredLocation.longitude
    );

    // Considerar válido si está dentro de 100 metros
    const isValid = distance <= 100;

    return {
      valid: isValid,
      location: currentLocation,
      distance: distance,
      message: isValid
        ? 'Ubicación válida para registro de ahorro'
        : `Ubicación fuera del rango permitido. Distancia: ${distance.toFixed(2)}m`,
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message,
      message: 'Error al obtener ubicación',
    };
  }
};

export const validateLocationForMeeting = async (meetingLocation) => {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      throw new Error('Permisos de ubicación denegados');
    }

    const currentLocation = await getCurrentLocation();

    const distance = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      meetingLocation.latitude,
      meetingLocation.longitude
    );

    // Para reuniones presenciales, considerar válido dentro de 50 metros
    const isValid = distance <= 50;

    return {
      valid: isValid,
      location: currentLocation,
      distance: distance,
      message: isValid
        ? 'Asistencia registrada correctamente'
        : `Fuera del rango de la reunión. Distancia: ${distance.toFixed(2)}m`,
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message,
      message: 'Error al validar asistencia',
    };
  }
};