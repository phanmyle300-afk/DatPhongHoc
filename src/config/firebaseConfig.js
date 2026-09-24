// Cấu hình kết nối Firebase Database & Authentication cho ứng dụng Đặt Phòng Học VKU
import AsyncStorage from '@react-native-async-storage/async-storage';

export const FIREBASE_CONFIG_KEY = '@vku_firebase_config_v1';

// Cấu hình Firebase mặc định (Người dùng có thể tùy chỉnh trực tiếp trên giao diện)
export const DEFAULT_FIREBASE_CONFIG = {
  projectId: 'datphonghoc',
  databaseURL: 'https://datphonghoc-default-rtdb.firebaseio.com',
  apiKey: 'AIzaSy_DatPhongHocVKU_Key',
  authDomain: 'datphonghoc.firebaseapp.com',
  storageBucket: 'datphonghoc.appspot.com',
  messagingSenderId: '849204918231',
  appId: '1:849204918231:web:datphonghoc',
};

/**
 * Lấy cấu hình Firebase hiện tại từ AsyncStorage hoặc dùng mặc định
 */
export const getStoredFirebaseConfig = async () => {
  try {
    const raw = await AsyncStorage.getItem(FIREBASE_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_FIREBASE_CONFIG, ...parsed };
    }
  } catch (e) {
    console.warn('Lỗi đọc cấu hình Firebase từ storage:', e);
  }
  return { ...DEFAULT_FIREBASE_CONFIG };
};

/**
 * Lưu cấu hình Firebase tùy chỉnh vào AsyncStorage
 */
export const saveStoredFirebaseConfig = async (newConfig) => {
  try {
    let cleanDbUrl = (newConfig.databaseURL || '').trim();
    if (cleanDbUrl.endsWith('/')) {
      cleanDbUrl = cleanDbUrl.slice(0, -1);
    }
    const merged = {
      ...DEFAULT_FIREBASE_CONFIG,
      ...newConfig,
      databaseURL: cleanDbUrl,
    };
    await AsyncStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(merged));
    return merged;
  } catch (e) {
    console.error('Lỗi lưu cấu hình Firebase:', e);
    return null;
  }
};

/**
 * Đặt lại cấu hình Firebase về mặc định
 */
export const resetFirebaseConfig = async () => {
  try {
    await AsyncStorage.removeItem(FIREBASE_CONFIG_KEY);
    return DEFAULT_FIREBASE_CONFIG;
  } catch (e) {
    return DEFAULT_FIREBASE_CONFIG;
  }
};
