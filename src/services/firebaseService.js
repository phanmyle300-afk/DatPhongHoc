// Dịch vụ quản trị Cơ sở dữ liệu và Xác thực Firebase (Firebase Realtime Database & Identity Services)
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStoredFirebaseConfig } from '../config/firebaseConfig';
import { INITIAL_USERS, INITIAL_ROOMS, getInitialBookingsData } from '../database/schema';

const FIREBASE_LOCAL_CACHE = {
  ROOMS: '@firebase_cache_rooms_v1',
  USERS: '@firebase_cache_users_v1',
  BOOKINGS: '@firebase_cache_bookings_v1',
  LAST_SYNC: '@firebase_last_sync_timestamp',
};

class FirebaseService {
  constructor() {
    this.config = null;
    this.isConnected = false;
    this.lastSyncTime = null;
  }

  /**
   * Tải cấu hình Firebase
   */
  async getConfig() {
    if (!this.config) {
      this.config = await getStoredFirebaseConfig();
    }
    return this.config;
  }

  /**
   * Cập nhật lại config bộ nhớ
   */
  setConfig(newConfig) {
    this.config = newConfig;
  }

  /**
   * Kiểm tra kết nối đến Firebase Database
   */
  async checkConnection() {
    try {
      const config = await this.getConfig();
      if (!config || !config.databaseURL) {
        return { connected: false, message: 'Chưa cấu hình URL Firebase Database' };
      }

      const candidateUrls = [
        config.databaseURL,
        `https://${config.projectId}-default-rtdb.firebaseio.com`,
        `https://${config.projectId}-default-rtdb.asia-southeast1.firebasedatabase.app`,
        `https://${config.projectId}-default-rtdb.europe-west1.firebasedatabase.app`,
      ].filter((u, i, arr) => u && arr.indexOf(u) === i);

      for (const url of candidateUrls) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 3500);

          const res = await fetch(`${url}/.json?shallow=true`, {
            signal: controller.signal,
          });
          clearTimeout(timeout);

          if (res.ok) {
            this.isConnected = true;
            this.config.databaseURL = url;
            this.lastSyncTime = new Date().toISOString();
            await AsyncStorage.setItem(FIREBASE_LOCAL_CACHE.LAST_SYNC, this.lastSyncTime);
            return {
              connected: true,
              projectId: config.projectId,
              databaseURL: url,
              message: 'Đã kết nối trực tiếp với Firebase Cloud Database (' + url + ')',
            };
          }
        } catch (candidateErr) {}
      }

      return {
        connected: false,
        message: 'Chưa khởi tạo Realtime Database trên project ' + config.projectId + ' (Đang dùng Local Synced Cache).',
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message,
        message: 'Đang kết nối Firebase qua bộ nhớ đệm đồng bộ cục bộ.',
      };
    }
  }

  // ==================== 1. CƠ SỞ DỮ LIỆU PHÒNG HỌC (ROOMS) ====================

  /**
   * Lấy danh sách phòng học từ Firebase.
   * Nếu Firebase chưa có, tự động nạp danh sách phòng hạt giống lên Firebase.
   */
  async getRooms() {
    try {
      const config = await this.getConfig();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(`${config.databaseURL}/rooms.json`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        if (data) {
          const roomsList = Array.isArray(data) ? data : Object.values(data);
          if (roomsList.length > 0) {
            // Lưu cache cục bộ
            await AsyncStorage.setItem(FIREBASE_LOCAL_CACHE.ROOMS, JSON.stringify(roomsList));
            return roomsList;
          }
        }
      }

      // Nếu trên Firebase rỗng hoặc chưa nạp, tự động seed danh mục phòng học
      await this.seedRooms(INITIAL_ROOMS);
    } catch (e) {
      // Fallback cache
    }

    // Đọc từ Cache cục bộ
    try {
      const cached = await AsyncStorage.getItem(FIREBASE_LOCAL_CACHE.ROOMS);
      if (cached) return JSON.parse(cached);
    } catch (e) {}

    return INITIAL_ROOMS;
  }

  /**
   * Đẩy danh sách phòng học lên Firebase Database (/rooms.json)
   */
  async seedRooms(rooms = INITIAL_ROOMS) {
    try {
      const config = await this.getConfig();
      // Ghi vào Cache trước để đảm bảo mượt mà
      await AsyncStorage.setItem(FIREBASE_LOCAL_CACHE.ROOMS, JSON.stringify(rooms));

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`${config.databaseURL}/rooms.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rooms),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      return res.ok;
    } catch (e) {
      console.warn('Lỗi seed rooms lên Firebase:', e.message);
      return false;
    }
  }

  // ==================== 2. CƠ SỞ DỮ LIỆU TÀI KHOẢN ĐĂNG KÝ (USERS) ====================

  /**
   * Lấy danh sách tài khoản đã đăng ký trên Firebase
   */
  async getUsers() {
    try {
      const config = await this.getConfig();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(`${config.databaseURL}/users.json`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        if (data) {
          const usersList = Array.isArray(data) ? data : Object.values(data);
          await AsyncStorage.setItem(FIREBASE_LOCAL_CACHE.USERS, JSON.stringify(usersList));
          return usersList;
        } else {
          await AsyncStorage.setItem(FIREBASE_LOCAL_CACHE.USERS, JSON.stringify([]));
          return [];
        }
      }
    } catch (e) {}

    // Fallback cache cục bộ
    try {
      const cached = await AsyncStorage.getItem(FIREBASE_LOCAL_CACHE.USERS);
      if (cached) return JSON.parse(cached);
    } catch (e) {}

    return INITIAL_USERS;
  }

  /**
   * Lưu hoặc cập nhật tài khoản sinh viên lên Firebase Database (/users/{userId}.json)
   */
  async saveUser(user) {
    try {
      const config = await this.getConfig();

      // Cập nhật Cache cục bộ
      const currentUsers = await this.getUsers();
      const existsIndex = currentUsers.findIndex(
        (u) => u.id === user.id || (u.email && user.email && u.email.toLowerCase() === user.email.toLowerCase())
      );
      let updatedUsers;
      if (existsIndex >= 0) {
        updatedUsers = [...currentUsers];
        updatedUsers[existsIndex] = { ...updatedUsers[existsIndex], ...user };
      } else {
        updatedUsers = [user, ...currentUsers];
      }
      await AsyncStorage.setItem(FIREBASE_LOCAL_CACHE.USERS, JSON.stringify(updatedUsers));

      // Đẩy lên Firebase REST API
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const userKey = user.id.replace(/[^a-zA-Z0-9_-]/g, '_');
      await fetch(`${config.databaseURL}/users/${userKey}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      return { success: true, user };
    } catch (e) {
      console.warn('Lỗi ghi user lên Firebase:', e.message);
      return { success: true, user, warning: 'Lưu offline cache' };
    }
  }

  // ==================== 3. CƠ SỞ DỮ LIỆU ĐÃ ĐẶT PHÒNG HỌC NÀO (BOOKINGS) ====================

  /**
   * Lấy toàn bộ danh sách phòng học đã được các tài khoản đặt trên Firebase
   */
  async getBookings() {
    try {
      const config = await this.getConfig();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(`${config.databaseURL}/bookings.json`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        if (data) {
          const bookingsList = Array.isArray(data) ? data : Object.values(data);
          bookingsList.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
          await AsyncStorage.setItem(FIREBASE_LOCAL_CACHE.BOOKINGS, JSON.stringify(bookingsList));
          return bookingsList;
        } else {
          await AsyncStorage.setItem(FIREBASE_LOCAL_CACHE.BOOKINGS, JSON.stringify([]));
          return [];
        }
      }
    } catch (e) {}

    // Fallback cache
    try {
      const cached = await AsyncStorage.getItem(FIREBASE_LOCAL_CACHE.BOOKINGS);
      if (cached) return JSON.parse(cached);
    } catch (e) {}

    return [];
  }

  /**
   * Thêm một lượt đặt phòng học mới lên Firebase:
   * Ghi nhận rõ: Tài khoản nào (userId, userName, studentId, email, provider)
   * đã đặt phòng học nào (roomId, roomCode, roomName, building, date, slotTime, purpose).
   */
  async createBooking(booking) {
    try {
      const config = await this.getConfig();

      // Cập nhật Cache cục bộ ngay lập tức
      const currentBookings = await this.getBookings();
      const updatedBookings = [booking, ...currentBookings];
      await AsyncStorage.setItem(FIREBASE_LOCAL_CACHE.BOOKINGS, JSON.stringify(updatedBookings));

      // Đẩy lên Firebase REST API
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const bookingKey = booking.id.replace(/[^a-zA-Z0-9_-]/g, '_');
      await fetch(`${config.databaseURL}/bookings/${bookingKey}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(booking),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      return { success: true, booking };
    } catch (e) {
      console.warn('Lỗi ghi booking lên Firebase:', e.message);
      return { success: true, booking, warning: 'Lưu offline cache' };
    }
  }

  /**
   * Cập nhật trạng thái đặt phòng học (active | completed | cancelled) trên Firebase
   */
  async updateBookingStatus(bookingId, status) {
    try {
      const config = await this.getConfig();

      // Cập nhật Cache cục bộ
      const currentBookings = await this.getBookings();
      const updatedBookings = currentBookings.map((b) =>
        b.id === bookingId ? { ...b, status } : b
      );
      await AsyncStorage.setItem(FIREBASE_LOCAL_CACHE.BOOKINGS, JSON.stringify(updatedBookings));

      // Cập nhật lên Firebase qua PATCH
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const bookingKey = bookingId.replace(/[^a-zA-Z0-9_-]/g, '_');
      await fetch(`${config.databaseURL}/bookings/${bookingKey}.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, updatedAt: new Date().toISOString() }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      return true;
    } catch (e) {
      console.warn('Lỗi cập nhật booking trên Firebase:', e.message);
      return false;
    }
  }

  // ==================== 4. XÁC THỰC GOOGLE & FACEBOOK ====================

  /**
   * Đăng ký / Đăng nhập bằng Google:
   * Nhận thông tin Google OAuth, lưu tài khoản vào Firebase /users/{id}
   */
  async authWithGoogle({ email, name, avatar }) {
    try {
      const cleanEmail = (email || '').trim().toLowerCase();
      const idPart = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
      const userId = `user_google_${idPart || Date.now()}`;

      const userRecord = {
        id: userId,
        name: name ? name.trim() : 'Người dùng Google',
        email: cleanEmail,
        avatar:
          avatar ||
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
        authProvider: 'google',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      // Lưu tài khoản vào Firebase Database
      await this.saveUser(userRecord);

      return { success: true, user: userRecord, provider: 'google' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Đăng ký / Đăng nhập bằng Facebook:
   * Nhận thông tin Facebook OAuth thực tế, lưu tài khoản vào Firebase /users/{id}
   */
  async authWithFacebook({ email, name, avatar }) {
    try {
      const cleanEmail = (email || `fb_${Date.now()}@facebook.com`).trim().toLowerCase();
      const idPart = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
      const userId = `user_fb_${idPart || Date.now()}`;

      const userRecord = {
        id: userId,
        name: name ? name.trim() : 'Người dùng Facebook',
        email: cleanEmail,
        avatar:
          avatar ||
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
        authProvider: 'facebook',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      // Lưu tài khoản vào Firebase Database
      await this.saveUser(userRecord);

      return { success: true, user: userRecord, provider: 'facebook' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ==================== 5. THỐNG KÊ TỔNG QUAN FIREBASE ====================

  /**
   * Lấy số liệu thống kê trực quan từ Firebase để hiển thị cho người dùng & kiểm tra
   */
  async getDatabaseOverview() {
    const rooms = await this.getRooms();
    const users = await this.getUsers();
    const bookings = await this.getBookings();

    const googleUsers = users.filter((u) => u.authProvider === 'google').length;
    const fbUsers = users.filter((u) => u.authProvider === 'facebook').length;
    const emailUsers = users.filter((u) => !u.authProvider || u.authProvider === 'email').length;

    const activeBookings = bookings.filter((b) => b.status === 'active').length;
    const completedBookings = bookings.filter((b) => b.status === 'completed').length;
    const cancelledBookings = bookings.filter((b) => b.status === 'cancelled').length;

    return {
      totalRooms: rooms.length,
      totalUsers: users.length,
      userStats: { googleUsers, fbUsers, emailUsers },
      totalBookings: bookings.length,
      bookingStats: { activeBookings, completedBookings, cancelledBookings },
      rooms,
      users,
      bookings,
    };
  }

  /**
   * Đồng bộ toàn bộ dữ liệu ban đầu lên Firebase Cloud
   */
  async syncAllToFirebase() {
    try {
      const config = await this.getConfig();
      const rooms = await this.getRooms();
      const users = await this.getUsers();
      const bookings = await this.getBookings();

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      // Đẩy full tree lên Firebase
      const res = await fetch(`${config.databaseURL}/.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rooms,
          users,
          bookings,
          lastSyncAt: new Date().toISOString(),
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      return {
        success: res.ok,
        message: res.ok
          ? 'Đã đồng bộ toàn bộ Phòng học, Tài khoản & Lịch đặt lên Firebase Cloud Database!'
          : 'Lỗi đồng bộ Firebase Cloud (Đã lưu vào bộ nhớ cache)',
      };
    } catch (e) {
      return {
        success: false,
        message: `Đồng bộ hoàn tất ở chế độ bộ nhớ đệm: ${e.message}`,
      };
    }
  }
}

export const firebaseService = new FirebaseService();
