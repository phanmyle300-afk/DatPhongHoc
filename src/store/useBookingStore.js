// Quản lý trạng thái toàn cục với Zustand kết nối Cơ sở dữ liệu Firebase & DatabaseService
import { create } from 'zustand';
import { dbService } from '../database/dbService';
import { firebaseService } from '../services/firebaseService';
import { TIME_SLOTS } from '../constants/slots';
import { generateBookingCode } from '../utils/helpers';
import { scheduleRoomReminder, cancelScheduledReminder } from '../services/notificationService';

export const useBookingStore = create((set, get) => ({
  // Trạng thái xác thực & Người dùng
  isAuthenticated: false,
  currentUser: null,
  allStudents: [],
  isDbLoaded: false,

  // Thông tin trạng thái Firebase
  firebaseStatus: {
    connected: false,
    checking: false,
    message: 'Chưa kết nối Firebase',
  },
  firebaseOverview: null,

  // Danh mục phòng học & Danh sách đặt phòng từ Database
  rooms: [],
  bookings: [],

  // Bộ lọc tìm kiếm
  filters: {
    searchQuery: '',
    selectedBuilding: 'ALL',
    minCapacity: 0,
    selectedAmenities: [],
    onlyAvailableNow: false,
  },

  // ==================== KHỞI TẠO DỮ LIỆU APP & DATABASE ====================
  initApp: async () => {
    try {
      await dbService.initDatabase();

      // Kiểm tra phiên đăng nhập đã lưu
      const savedSession = await dbService.auth_getSession();
      let cleanSession = savedSession;
      if (cleanSession) {
        delete cleanSession.studentId;
        delete cleanSession.faculty;
        delete cleanSession.major;
        delete cleanSession.class;
        await dbService.auth_saveSession(cleanSession);
      }

      const rooms = await dbService.db_getRooms();
      const bookings = await dbService.db_getBookings();
      const students = await dbService.db_getUsers();

      set({
        isAuthenticated: !!cleanSession,
        currentUser: cleanSession || null,
        rooms,
        bookings,
        allStudents: students,
        isDbLoaded: true,
      });

      // Tải trạng thái và tổng quan Firebase
      get().checkFirebaseConnection();
    } catch (e) {
      console.error('Lỗi nạp dữ liệu app:', e);
      set({ isDbLoaded: true });
    }
  },

  // ==================== FIREBASE SYNC & CONNECTION ====================
  checkFirebaseConnection: async () => {
    set((state) => ({
      firebaseStatus: { ...state.firebaseStatus, checking: true },
    }));

    try {
      const conn = await firebaseService.checkConnection();
      const overview = await firebaseService.getDatabaseOverview();

      set({
        firebaseStatus: {
          connected: conn.connected,
          checking: false,
          message: conn.message || (conn.connected ? 'Đã kết nối Firebase Database' : 'Chế độ Local Cache'),
        },
        firebaseOverview: overview,
      });
    } catch (e) {
      set({
        firebaseStatus: {
          connected: false,
          checking: false,
          message: 'Không thể kết nối máy chủ Firebase',
        },
      });
    }
  },

  syncWithFirebase: async () => {
    const res = await firebaseService.syncAllToFirebase();
    const rooms = await dbService.db_getRooms();
    const bookings = await dbService.db_getBookings();
    const students = await dbService.db_getUsers();
    const overview = await firebaseService.getDatabaseOverview();

    set({
      rooms,
      bookings,
      allStudents: students,
      firebaseOverview: overview,
    });

    return res;
  },

  // ==================== AUTH ACTIONS ====================

  /**
   * Đăng nhập / Đăng ký qua Google
   */
  loginWithGoogle: async (googlePayload) => {
    const result = await dbService.auth_login_google(googlePayload);
    if (result.success && result.user) {
      const bookings = await dbService.db_getBookings();
      const students = await dbService.db_getUsers();
      set({
        isAuthenticated: true,
        currentUser: result.user,
        bookings,
        allStudents: students,
      });
      get().checkFirebaseConnection();
    }
    return result;
  },

  /**
   * Đăng nhập / Đăng ký qua Facebook
   */
  loginWithFacebook: async (fbPayload) => {
    const result = await dbService.auth_login_facebook(fbPayload);
    if (result.success && result.user) {
      const bookings = await dbService.db_getBookings();
      const students = await dbService.db_getUsers();
      set({
        isAuthenticated: true,
        currentUser: result.user,
        bookings,
        allStudents: students,
      });
      get().checkFirebaseConnection();
    }
    return result;
  },

  /**
   * Đăng nhập bằng MSSV / Email + Password thông thường
   */
  login: async ({ identifier, password }) => {
    const result = await dbService.auth_login(identifier, password);
    if (result.success) {
      const bookings = await dbService.db_getBookings();
      const students = await dbService.db_getUsers();
      set({
        isAuthenticated: true,
        currentUser: result.user,
        bookings,
        allStudents: students,
      });
      get().checkFirebaseConnection();
    }
    return result;
  },

  /**
   * Đăng ký tài khoản mới lưu lên Firebase
   */
  register: async (studentData) => {
    const result = await dbService.auth_register(studentData);
    if (result.success) {
      const students = await dbService.db_getUsers();
      set({
        isAuthenticated: true,
        currentUser: result.user,
        allStudents: students,
      });
      get().checkFirebaseConnection();
    }
    return result;
  },

  logout: async () => {
    await dbService.auth_logout();
    set({
      isAuthenticated: false,
      currentUser: null,
    });
  },

  switchUser: async (studentId) => {
    const { allStudents } = get();
    const found = allStudents.find(
      (s) => s.id === studentId || s.studentId === studentId
    );
    if (found) {
      await dbService.auth_saveSession(found);
      set({ currentUser: found, isAuthenticated: true });
    }
  },

  // ==================== ACTIONS CHO BỘ LỌC ====================
  setSearchQuery: (searchQuery) =>
    set((state) => ({
      filters: { ...state.filters, searchQuery },
    })),

  setSelectedBuilding: (selectedBuilding) =>
    set((state) => ({
      filters: { ...state.filters, selectedBuilding },
    })),

  setMinCapacity: (minCapacity) =>
    set((state) => ({
      filters: { ...state.filters, minCapacity },
    })),

  toggleAmenity: (amenity) =>
    set((state) => {
      const currentAmenities = state.filters.selectedAmenities;
      const exists = currentAmenities.includes(amenity);
      const updated = exists
        ? currentAmenities.filter((a) => a !== amenity)
        : [...currentAmenities, amenity];
      return {
        filters: { ...state.filters, selectedAmenities: updated },
      };
    }),

  setOnlyAvailableNow: (onlyAvailableNow) =>
    set((state) => ({
      filters: { ...state.filters, onlyAvailableNow },
    })),

  resetFilters: () =>
    set((state) => ({
      filters: {
        searchQuery: '',
        selectedBuilding: 'ALL',
        minCapacity: 0,
        selectedAmenities: [],
        onlyAvailableNow: false,
      },
    })),

  // ==================== KIỂM TRA XUNG ĐỘT (CONFLICT PREVENTION) ====================
  isSlotBooked: (roomId, dateStr, slotId) => {
    const { bookings } = get();
    return bookings.some(
      (b) =>
        b.roomId === roomId &&
        b.dateStr === dateStr &&
        b.slotId === slotId &&
        b.status === 'active'
    );
  },

  getSlotBookingInfo: (roomId, dateStr, slotId) => {
    const { bookings } = get();
    return bookings.find(
      (b) =>
        b.roomId === roomId &&
        b.dateStr === dateStr &&
        b.slotId === slotId &&
        b.status === 'active'
    );
  },

  hasUserConflict: (userId, dateStr, slotId) => {
    const { bookings } = get();
    return bookings.some(
      (b) =>
        b.userId === userId &&
        b.dateStr === dateStr &&
        b.slotId === slotId &&
        b.status === 'active'
    );
  },

  // ==================== ACTIONS ĐẶT PHÒNG & LƯU FIREBASE DATABASE ====================
  bookRoom: async ({ roomId, dateStr, slotId, purpose, studentCount }) => {
    const state = get();
    const { rooms, currentUser, isSlotBooked, hasUserConflict } = state;

    if (!currentUser) {
      return { success: false, error: 'Vui lòng đăng nhập tài khoản sinh viên để đặt phòng!' };
    }

    const room = rooms.find((r) => r.id === roomId);
    if (!room) {
      return { success: false, error: 'Không tìm thấy thông tin phòng học.' };
    }

    // 1. Kiểm tra phòng đã có người khác đặt chưa
    if (isSlotBooked(roomId, dateStr, slotId)) {
      return {
        success: false,
        error: `Khung giờ này tại phòng ${room.code} đã có người giữ chỗ! Vui lòng chọn ca hoặc ngày khác.`,
      };
    }

    // 2. Kiểm tra sinh viên có bị trùng lịch cá nhân không
    if (hasUserConflict(currentUser.id, dateStr, slotId)) {
      return {
        success: false,
        error: 'Bạn đã có một lịch đặt phòng học khác trong cùng khung giờ này!',
      };
    }

    const slot = TIME_SLOTS.find((s) => s.id === slotId);
    const bookingCode = generateBookingCode(room.code);

    // 3. Lên lịch thông báo cục bộ trước 15 phút
    const notificationId = await scheduleRoomReminder({
      bookingId: `bk_${Date.now()}`,
      roomName: room.name,
      roomCode: room.code,
      dateStr,
      slotId,
    });

    const newBooking = {
      id: `bk_${Date.now()}`,
      bookingCode,
      roomId: room.id,
      roomCode: room.code,
      roomName: room.name,
      building: room.building,
      floor: room.floor,
      dateStr,
      slotId,
      slotTime: slot ? `${slot.startTime} - ${slot.endTime}` : '',
      userId: currentUser.id,
      userName: currentUser.name,
      studentId: currentUser.studentId || '',
      userEmail: currentUser.email || '',
      authProvider: currentUser.authProvider || 'email',
      purpose: purpose || 'Tự học & Thảo luận nhóm',
      studentCount: studentCount || 2,
      status: 'active',
      createdAt: new Date().toISOString(),
      notificationId,
    };

    // 4. Lưu trực tiếp vào Firebase Database
    await dbService.db_insertBooking(newBooking);

    // Cập nhật State
    set((s) => ({
      bookings: [newBooking, ...s.bookings],
    }));

    // Cập nhật thống kê Firebase
    get().checkFirebaseConnection();

    return { success: true, booking: newBooking };
  },

  // ==================== ACTION HỦY ĐẶT PHÒNG ====================
  cancelBooking: async (bookingId) => {
    const { bookings } = get();
    const targetBooking = bookings.find((b) => b.id === bookingId);
    if (!targetBooking) return false;

    // Hủy thông báo đã lên lịch
    if (targetBooking.notificationId) {
      await cancelScheduledReminder(targetBooking.notificationId);
    }

    // Cập nhật trong Firebase Database
    await dbService.db_updateBookingStatus(bookingId, 'cancelled');

    // Cập nhật State
    set({
      bookings: bookings.map((b) =>
        b.id === bookingId ? { ...b, status: 'cancelled' } : b
      ),
    });

    get().checkFirebaseConnection();
    return true;
  },

  // ==================== ACTION CHECK-IN ====================
  checkInBooking: async (bookingId) => {
    const { bookings } = get();
    await dbService.db_updateBookingStatus(bookingId, 'completed');
    set({
      bookings: bookings.map((b) =>
        b.id === bookingId ? { ...b, status: 'completed' } : b
      ),
    });
    get().checkFirebaseConnection();
  },

  // Khôi phục Database ban đầu
  resetDatabase: async () => {
    await dbService.db_resetDatabase();
    await get().initApp();
  },
}));
