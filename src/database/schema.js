// Định nghĩa Schema và Dữ liệu hạt giống khởi tạo cho Cơ sở dữ liệu VKU
import { MOCK_ROOMS } from '../data/mockRooms';

export const DB_KEYS = {
  USERS_TABLE: '@vku_db_users_v1',
  ROOMS_TABLE: '@vku_db_rooms_v1',
  BOOKINGS_TABLE: '@vku_db_bookings_v1',
  SESSION_TABLE: '@vku_db_session_v1',
  INITIALIZED_FLAG: '@vku_db_initialized_flag_v1',
};

// Dữ liệu tài khoản sinh viên: Để rỗng để người dùng tự đăng ký tài khoản mới
export const INITIAL_USERS = [];

// Dữ liệu đặt phòng: Để rỗng để người dùng tự đặt phòng học theo nhu cầu
export const getInitialBookingsData = () => [];

// Danh mục 100 phòng học khởi tạo
export const INITIAL_ROOMS = MOCK_ROOMS;
