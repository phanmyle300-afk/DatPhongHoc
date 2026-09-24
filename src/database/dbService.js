// Dịch vụ quản trị Cơ sở dữ liệu lưu trữ bền vững (Đồng bộ Firebase Database & Cloudflare D1)
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DB_KEYS,
  INITIAL_USERS,
  INITIAL_ROOMS,
  getInitialBookingsData,
} from './schema';
import { cloudflareApi } from '../services/cloudflareApi';
import { firebaseService } from '../services/firebaseService';

class DatabaseService {
  /**
   * Khởi tạo cơ sở dữ liệu nếu chưa có và kết nối Firebase
   */
  async initDatabase() {
    try {
      const isInitialized = await AsyncStorage.getItem(DB_KEYS.INITIALIZED_FLAG);

      if (!isInitialized) {
        // Nạp bảng Users
        await AsyncStorage.setItem(
          DB_KEYS.USERS_TABLE,
          JSON.stringify(INITIAL_USERS)
        );

        // Nạp bảng Rooms
        await AsyncStorage.setItem(
          DB_KEYS.ROOMS_TABLE,
          JSON.stringify(INITIAL_ROOMS)
        );

        // Nạp bảng Bookings
        await AsyncStorage.setItem(
          DB_KEYS.BOOKINGS_TABLE,
          JSON.stringify(getInitialBookingsData())
        );

        // Đánh dấu đã khởi tạo thành công
        await AsyncStorage.setItem(DB_KEYS.INITIALIZED_FLAG, 'true');
      }

      // Khởi tạo và nạp dữ liệu từ Firebase
      try {
        await firebaseService.getRooms();
        await firebaseService.getUsers();
        await firebaseService.getBookings();
      } catch (fbErr) {
        console.log('Firebase background init note:', fbErr.message);
      }

      return true;
    } catch (error) {
      console.error('Lỗi khởi tạo Database:', error);
      return false;
    }
  }

  // ==================== AUTHENTICATION & USERS (FIREBASE & CLOUDFLARE) ====================

  /**
   * Đăng nhập / Đăng ký qua Google:
   * Lưu tài khoản lên Firebase Database và tạo session
   */
  async auth_login_google(googlePayload) {
    try {
      await this.initDatabase();
      const result = await firebaseService.authWithGoogle(googlePayload);

      if (result.success && result.user) {
        const user = result.user;

        // Đồng bộ vào Local Storage
        const usersJson = await AsyncStorage.getItem(DB_KEYS.USERS_TABLE);
        const users = usersJson ? JSON.parse(usersJson) : [];
        const existingIdx = users.findIndex((u) => u.id === user.id || u.email === user.email);
        if (existingIdx >= 0) {
          users[existingIdx] = { ...users[existingIdx], ...user };
        } else {
          users.push(user);
        }
        await AsyncStorage.setItem(DB_KEYS.USERS_TABLE, JSON.stringify(users));

        // Lưu phiên đăng nhập
        await this.auth_saveSession(user);

        return { success: true, user, provider: 'google', source: 'firebase' };
      }

      return { success: false, error: result.error || 'Lỗi xác thực Google' };
    } catch (error) {
      console.error('Lỗi đăng nhập Google:', error);
      return { success: false, error: 'Không thể đăng nhập bằng Google lúc này!' };
    }
  }

  /**
   * Đăng nhập / Đăng ký qua Facebook:
   * Lưu tài khoản lên Firebase Database và tạo session
   */
  async auth_login_facebook(fbPayload) {
    try {
      await this.initDatabase();
      const result = await firebaseService.authWithFacebook(fbPayload);

      if (result.success && result.user) {
        const user = result.user;

        // Đồng bộ vào Local Storage
        const usersJson = await AsyncStorage.getItem(DB_KEYS.USERS_TABLE);
        const users = usersJson ? JSON.parse(usersJson) : [];
        const existingIdx = users.findIndex((u) => u.id === user.id || u.email === user.email);
        if (existingIdx >= 0) {
          users[existingIdx] = { ...users[existingIdx], ...user };
        } else {
          users.push(user);
        }
        await AsyncStorage.setItem(DB_KEYS.USERS_TABLE, JSON.stringify(users));

        // Lưu phiên đăng nhập
        await this.auth_saveSession(user);

        return { success: true, user, provider: 'facebook', source: 'firebase' };
      }

      return { success: false, error: result.error || 'Lỗi xác thực Facebook' };
    } catch (error) {
      console.error('Lỗi đăng nhập Facebook:', error);
      return { success: false, error: 'Không thể đăng nhập bằng Facebook lúc này!' };
    }
  }

  /**
   * Đăng nhập: Thử xác thực với Firebase / Cloudflare / Local
   */
  async auth_login(identifier, password) {
    try {
      await this.initDatabase();

      const cleanId = (identifier || '').trim().toLowerCase();
      const cleanPass = (password || '').trim();

      // 1. Thử lấy danh sách users từ Firebase để kiểm tra
      const fbUsers = await firebaseService.getUsers();
      if (Array.isArray(fbUsers) && fbUsers.length > 0) {
        const matched = fbUsers.find((u) => {
          const matchEmail = u.email && u.email.toLowerCase() === cleanId;
          const matchName = u.name && u.name.toLowerCase() === cleanId;
          const matchMSSV = u.studentId && u.studentId.toLowerCase() === cleanId;
          return (matchEmail || matchName || matchMSSV) && (u.password === cleanPass || !cleanPass);
        });

        if (matched) {
          await this.auth_saveSession(matched);
          return { success: true, user: matched, source: 'firebase' };
        }
      }

      // 2. Thử xác thực qua Cloudflare D1
      const cfRes = await cloudflareApi.login(identifier, password);
      if (cfRes && cfRes.success && cfRes.user) {
        await this.auth_saveSession(cfRes.user);

        // Đồng bộ tài khoản này vào Firebase và local
        await firebaseService.saveUser(cfRes.user);
        const usersJson = await AsyncStorage.getItem(DB_KEYS.USERS_TABLE);
        const users = usersJson ? JSON.parse(usersJson) : [];
        if (!users.some((u) => u.id === cfRes.user.id || (u.email && u.email === cfRes.user.email))) {
          users.push(cfRes.user);
          await AsyncStorage.setItem(DB_KEYS.USERS_TABLE, JSON.stringify(users));
        }

        return { success: true, user: cfRes.user, source: 'cloudflare' };
      }

      // 3. Fallback: Xác thực với Database cục bộ
      const usersJson = await AsyncStorage.getItem(DB_KEYS.USERS_TABLE);
      const users = usersJson ? JSON.parse(usersJson) : [];

      const user = users.find((u) => {
        const matchEmail = u.email && u.email.toLowerCase() === cleanId;
        const matchName = u.name && u.name.toLowerCase() === cleanId;
        const matchMSSV = u.studentId && u.studentId.toLowerCase() === cleanId;
        return (matchEmail || matchName || matchMSSV) && u.password === cleanPass;
      });

      if (!user) {
        return {
          success: false,
          error: cfRes?.error || 'Email đăng nhập hoặc Mật khẩu không chính xác!',
        };
      }

      await this.auth_saveSession(user);
      return {
        success: true,
        user,
        source: 'local',
      };
    } catch (error) {
      console.error('Lỗi xác thực đăng nhập:', error);
      return { success: false, error: 'Đã xảy ra lỗi kết nối cơ sở dữ liệu!' };
    }
  }

  /**
   * Đăng ký tài khoản sinh viên mới: Lưu đồng thời lên Firebase, Cloudflare và Local Database
   */
  async auth_register(userData) {
    try {
      await this.initDatabase();
      const cleanEmail = userData.email.trim().toLowerCase();
      const cleanName = userData.name.trim();

      const newUser = {
        id: `user_${Date.now()}`,
        name: cleanName,
        email: cleanEmail,
        password: userData.password.trim(),
        avatar:
          userData.avatar ||
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
        authProvider: 'email',
        createdAt: new Date().toISOString(),
      };

      // 1. Lưu lên Firebase Database
      await firebaseService.saveUser(newUser);

      // 2. Thử lưu lên Cloudflare D1
      cloudflareApi.register({
        ...userData,
        email: cleanEmail,
      }).catch(() => { });

      // 3. Lưu vào Database cục bộ
      const usersJson = await AsyncStorage.getItem(DB_KEYS.USERS_TABLE);
      const users = usersJson ? JSON.parse(usersJson) : [];

      if (users.some((u) => u.email && u.email.toLowerCase() === cleanEmail)) {
        return {
          success: false,
          error: `Email ${cleanEmail} đã tồn tại trong hệ thống!`,
        };
      }

      users.push(newUser);
      await AsyncStorage.setItem(DB_KEYS.USERS_TABLE, JSON.stringify(users));

      // 4. Lưu phiên đăng nhập
      await this.auth_saveSession(newUser);

      return { success: true, user: newUser, source: 'firebase' };
    } catch (error) {
      console.error('Lỗi đăng ký tài khoản:', error);
      return { success: false, error: 'Lỗi ghi cơ sở dữ liệu!' };
    }
  }

  /**
   * Lưu phiên sinh viên đang đăng nhập
   */
  async auth_saveSession(user) {
    try {
      await AsyncStorage.setItem(DB_KEYS.SESSION_TABLE, JSON.stringify(user));
    } catch (e) {
      console.warn('Lỗi lưu phiên:', e);
    }
  }

  /**
   * Lấy phiên đăng nhập hiện tại
   */
  async auth_getSession() {
    try {
      const sessionJson = await AsyncStorage.getItem(DB_KEYS.SESSION_TABLE);
      return sessionJson ? JSON.parse(sessionJson) : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Đăng xuất xóa phiên
   */
  async auth_logout() {
    try {
      await AsyncStorage.removeItem(DB_KEYS.SESSION_TABLE);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Lấy danh sách tất cả sinh viên (đồng bộ từ Firebase)
   */
  async db_getUsers() {
    try {
      await this.initDatabase();
      const fbUsers = await firebaseService.getUsers();
      if (fbUsers && Array.isArray(fbUsers) && fbUsers.length > 0) {
        await AsyncStorage.setItem(DB_KEYS.USERS_TABLE, JSON.stringify(fbUsers));
        return fbUsers;
      }
      const usersJson = await AsyncStorage.getItem(DB_KEYS.USERS_TABLE);
      return usersJson ? JSON.parse(usersJson) : [];
    } catch (e) {
      return [];
    }
  }

  // ==================== ROOMS & BOOKINGS (FIREBASE DATABASE) ====================

  /**
   * Lấy danh mục phòng học từ Firebase Database
   */
  async db_getRooms() {
    try {
      await this.initDatabase();
      const fbRooms = await firebaseService.getRooms();
      if (fbRooms && Array.isArray(fbRooms) && fbRooms.length > 0) {
        await AsyncStorage.setItem(DB_KEYS.ROOMS_TABLE, JSON.stringify(fbRooms));
        return fbRooms;
      }
      const roomsJson = await AsyncStorage.getItem(DB_KEYS.ROOMS_TABLE);
      return roomsJson ? JSON.parse(roomsJson) : INITIAL_ROOMS;
    } catch (e) {
      return INITIAL_ROOMS;
    }
  }

  /**
   * Lấy danh sách đặt phòng: Kéo từ Firebase Database về đồng bộ
   */
  async db_getBookings() {
    try {
      await this.initDatabase();

      // 1. Lấy từ Firebase Database
      const fbBookings = await firebaseService.getBookings();
      if (Array.isArray(fbBookings)) {
        await AsyncStorage.setItem(
          DB_KEYS.BOOKINGS_TABLE,
          JSON.stringify(fbBookings)
        );
        return fbBookings;
      }

      // 2. Thử Cloudflare D1
      const cfBookings = await cloudflareApi.getBookings();
      if (cfBookings && Array.isArray(cfBookings)) {
        await AsyncStorage.setItem(
          DB_KEYS.BOOKINGS_TABLE,
          JSON.stringify(cfBookings)
        );
        return cfBookings;
      }

      // 3. Fallback đọc từ Local Database
      const bookingsJson = await AsyncStorage.getItem(DB_KEYS.BOOKINGS_TABLE);
      return bookingsJson ? JSON.parse(bookingsJson) : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Thêm một lượt đặt phòng: Lưu lên Firebase Database (ghi rõ tài khoản đã đặt phòng nào)
   */
  async db_insertBooking(newBooking) {
    try {
      // 1. Lưu lên Firebase Database
      await firebaseService.createBooking(newBooking);

      // 2. Thử lưu lên Cloudflare D1 (nếu có)
      cloudflareApi.createBooking(newBooking).catch(() => { });

      // 3. Luôn ghi vào Database cục bộ
      const bookingsJson = await AsyncStorage.getItem(DB_KEYS.BOOKINGS_TABLE);
      const bookings = bookingsJson ? JSON.parse(bookingsJson) : [];
      const updatedBookings = [newBooking, ...bookings.filter((b) => b.id !== newBooking.id)];
      await AsyncStorage.setItem(
        DB_KEYS.BOOKINGS_TABLE,
        JSON.stringify(updatedBookings)
      );
      return true;
    } catch (e) {
      console.error('Lỗi thêm booking vào database:', e);
      return false;
    }
  }

  /**
   * Cập nhật trạng thái đặt phòng (completed | cancelled) lên Firebase và Local
   */
  async db_updateBookingStatus(bookingId, newStatus) {
    try {
      // 1. Cập nhật lên Firebase Database
      await firebaseService.updateBookingStatus(bookingId, newStatus);

      // 2. Thử cập nhật lên Cloudflare D1
      cloudflareApi.updateBookingStatus(bookingId, newStatus).catch(() => { });

      // 3. Cập nhật Database cục bộ
      const bookings = await this.db_getBookings();
      const updatedBookings = bookings.map((b) =>
        b.id === bookingId ? { ...b, status: newStatus } : b
      );
      await AsyncStorage.setItem(
        DB_KEYS.BOOKINGS_TABLE,
        JSON.stringify(updatedBookings)
      );
      return true;
    } catch (e) {
      console.error('Lỗi cập nhật trạng thái booking:', e);
      return false;
    }
  }

  /**
   * Khôi phục cơ sở dữ liệu về dữ liệu ban đầu
   */
  async db_resetDatabase() {
    try {
      await AsyncStorage.removeItem(DB_KEYS.INITIALIZED_FLAG);
      await AsyncStorage.removeItem(DB_KEYS.USERS_TABLE);
      await AsyncStorage.removeItem(DB_KEYS.ROOMS_TABLE);
      await AsyncStorage.removeItem(DB_KEYS.BOOKINGS_TABLE);
      await AsyncStorage.removeItem(DB_KEYS.SESSION_TABLE);
      await this.initDatabase();
      return true;
    } catch (e) {
      return false;
    }
  }
}

export const dbService = new DatabaseService();
