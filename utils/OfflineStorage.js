import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';

const STORAGE_KEYS = {
  USER_DATA: 'user_data',
  SAVINGS_CACHE: 'savings_cache',
  LOANS_CACHE: 'loans_cache',
  MEETINGS_CACHE: 'meetings_cache',
  ATTENDANCE_CACHE: 'attendance_cache',
  STATEMENTS_CACHE: 'statements_cache',
  SYNC_STATUS: 'sync_status',
  LAST_SYNC: 'last_sync',
};

// User data management
export const saveUserData = async (userData) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
  } catch (error) {
    console.error('Error saving user data:', error);
  }
};

export const getUserData = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

export const clearUserData = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
  } catch (error) {
    console.error('Error clearing user data:', error);
  }
};

// Cache management for different data types
export const saveToCache = async (key, data, expirationMinutes = 30) => {
  try {
    const cacheData = {
      data,
      timestamp: Date.now(),
      expiration: expirationMinutes * 60 * 1000, // Convert to milliseconds
    };
    await AsyncStorage.setItem(key, JSON.stringify(cacheData));
  } catch (error) {
    console.error(`Error saving to cache (${key}):`, error);
  }
};

export const getFromCache = async (key) => {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return null;

    const cacheData = JSON.parse(cached);
    const now = Date.now();
    const isExpired = now - cacheData.timestamp > cacheData.expiration;

    if (isExpired) {
      await AsyncStorage.removeItem(key);
      return null;
    }

    return cacheData.data;
  } catch (error) {
    console.error(`Error getting from cache (${key}):`, error);
    return null;
  }
};

// Savings operations
export const saveSavingsOffline = async (savingData) => {
  try {
    const existingSavings = await getFromCache(STORAGE_KEYS.SAVINGS_CACHE) || [];
    const newSaving = {
      ...savingData,
      id: `offline_${Date.now()}_${Math.random()}`,
      offline: true,
      created_at: new Date().toISOString(),
    };

    existingSavings.push(newSaving);
    await saveToCache(STORAGE_KEYS.SAVINGS_CACHE, existingSavings, 1440); // 24 hours

    return newSaving;
  } catch (error) {
    console.error('Error saving savings offline:', error);
    throw error;
  }
};

export const getOfflineSavings = async () => {
  return await getFromCache(STORAGE_KEYS.SAVINGS_CACHE) || [];
};

// Loan operations
export const saveLoanRequestOffline = async (loanData) => {
  try {
    const existingLoans = await getFromCache(STORAGE_KEYS.LOANS_CACHE) || [];
    const newLoan = {
      ...loanData,
      id: `offline_${Date.now()}_${Math.random()}`,
      offline: true,
      estado: 'pendiente',
      created_at: new Date().toISOString(),
    };

    existingLoans.push(newLoan);
    await saveToCache(STORAGE_KEYS.LOANS_CACHE, existingLoans, 1440);

    return newLoan;
  } catch (error) {
    console.error('Error saving loan request offline:', error);
    throw error;
  }
};

export const getOfflineLoans = async () => {
  return await getFromCache(STORAGE_KEYS.LOANS_CACHE) || [];
};

// Meeting attendance operations
export const saveAttendanceOffline = async (attendanceData) => {
  try {
    const existingAttendance = await getFromCache(STORAGE_KEYS.ATTENDANCE_CACHE) || [];
    const newAttendance = {
      ...attendanceData,
      id: `offline_${Date.now()}_${Math.random()}`,
      offline: true,
      fecha_asistencia: new Date().toISOString().split('T')[0],
      hora_asistencia: new Date().toTimeString().split(' ')[0],
      created_at: new Date().toISOString(),
    };

    existingAttendance.push(newAttendance);
    await saveToCache(STORAGE_KEYS.ATTENDANCE_CACHE, existingAttendance, 1440);

    return newAttendance;
  } catch (error) {
    console.error('Error saving attendance offline:', error);
    throw error;
  }
};

export const getOfflineAttendance = async () => {
  return await getFromCache(STORAGE_KEYS.ATTENDANCE_CACHE) || [];
};

// Sync status management
export const setSyncStatus = async (status) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SYNC_STATUS, JSON.stringify({
      status,
      timestamp: Date.now(),
    }));
  } catch (error) {
    console.error('Error setting sync status:', error);
  }
};

export const getSyncStatus = async () => {
  try {
    const status = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_STATUS);
    return status ? JSON.parse(status) : { status: 'idle', timestamp: null };
  } catch (error) {
    console.error('Error getting sync status:', error);
    return { status: 'idle', timestamp: null };
  }
};

export const setLastSync = async (timestamp) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, timestamp.toString());
  } catch (error) {
    console.error('Error setting last sync:', error);
  }
};

export const getLastSync = async () => {
  try {
    const timestamp = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    return timestamp ? new Date(parseInt(timestamp)) : null;
  } catch (error) {
    console.error('Error getting last sync:', error);
    return null;
  }
};

// Synchronization functions
export const syncOfflineData = async (userId) => {
  try {
    setSyncStatus('syncing');

    // Sync savings
    const offlineSavings = await getOfflineSavings();
    for (const saving of offlineSavings) {
      try {
        const { error } = await supabase
          .from('ahorros')
          .insert({
            usuario_id: userId,
            monto: saving.monto,
            descripcion: saving.descripcion,
            fecha: saving.fecha,
            ubicacion_lat: saving.ubicacion_lat,
            ubicacion_lng: saving.ubicacion_lng,
            firma_digital: saving.firma_digital,
          });

        if (!error) {
          // Remove from offline storage
          const updatedSavings = offlineSavings.filter(s => s.id !== saving.id);
          await saveToCache(STORAGE_KEYS.SAVINGS_CACHE, updatedSavings, 1440);
        }
      } catch (syncError) {
        console.error('Error syncing saving:', syncError);
      }
    }

    // Sync loan requests
    const offlineLoans = await getOfflineLoans();
    for (const loan of offlineLoans) {
      try {
        const { error } = await supabase
          .from('prestamos')
          .insert({
            usuario_id: userId,
            monto_solicitado: loan.monto_solicitado,
            tasa_interes: loan.tasa_interes,
            proposito: loan.proposito,
            estado: 'pendiente',
          });

        if (!error) {
          const updatedLoans = offlineLoans.filter(l => l.id !== loan.id);
          await saveToCache(STORAGE_KEYS.LOANS_CACHE, updatedLoans, 1440);
        }
      } catch (syncError) {
        console.error('Error syncing loan:', syncError);
      }
    }

    // Sync attendance
    const offlineAttendance = await getOfflineAttendance();
    for (const attendance of offlineAttendance) {
      try {
        const { error } = await supabase
          .from('asistencia_reuniones')
          .insert({
            reunion_id: attendance.reunion_id,
            usuario_id: userId,
            fecha_asistencia: attendance.fecha_asistencia,
            hora_asistencia: attendance.hora_asistencia,
            metodo_validacion: attendance.metodo_validacion,
          });

        if (!error) {
          const updatedAttendance = offlineAttendance.filter(a => a.id !== attendance.id);
          await saveToCache(STORAGE_KEYS.ATTENDANCE_CACHE, updatedAttendance, 1440);
        }
      } catch (syncError) {
        console.error('Error syncing attendance:', syncError);
      }
    }

    setLastSync(new Date());
    setSyncStatus('completed');

    return {
      success: true,
      syncedSavings: offlineSavings.length,
      syncedLoans: offlineLoans.length,
      syncedAttendance: offlineAttendance.length,
    };
  } catch (error) {
    console.error('Error during sync:', error);
    setSyncStatus('error');
    return { success: false, error: error.message };
  }
};

// Clear all offline data
export const clearOfflineData = async () => {
  try {
    const keys = [
      STORAGE_KEYS.SAVINGS_CACHE,
      STORAGE_KEYS.LOANS_CACHE,
      STORAGE_KEYS.MEETINGS_CACHE,
      STORAGE_KEYS.ATTENDANCE_CACHE,
      STORAGE_KEYS.STATEMENTS_CACHE,
    ];

    await AsyncStorage.multiRemove(keys);
  } catch (error) {
    console.error('Error clearing offline data:', error);
  }
};

// Get storage info
export const getStorageInfo = async () => {
  try {
    const savings = await getOfflineSavings();
    const loans = await getOfflineLoans();
    const attendance = await getOfflineAttendance();
    const syncStatus = await getSyncStatus();
    const lastSync = await getLastSync();

    return {
      offlineSavingsCount: savings.length,
      offlineLoansCount: loans.length,
      offlineAttendanceCount: attendance.length,
      syncStatus: syncStatus.status,
      lastSync,
    };
  } catch (error) {
    console.error('Error getting storage info:', error);
    return null;
  }
};