// Dịch vụ giao tiếp với Cloudflare D1 Database qua Cloudflare Worker API
import AsyncStorage from '@react-native-async-storage/async-storage';

const CF_ENDPOINT_KEY = '@vku_cloudflare_endpoint_url_v1';
const DEFAULT_CF_ENDPOINT = 'https://vku-room-booking-api.workers.dev';

class CloudflareApiService {
  constructor() {
    this.endpoint = null;
  }

  /**
   * Lấy đường dẫn Cloudflare Worker API hiện tại
   */
  async getEndpoint() {
    if (this.endpoint) return this.endpoint;
    try {
      const saved = await AsyncStorage.getItem(CF_ENDPOINT_KEY);
      this.endpoint = saved || DEFAULT_CF_ENDPOINT;
      return this.endpoint;
    } catch (e) {
      return DEFAULT_CF_ENDPOINT;
    }
  }

  /**
   * Lưu cấu hình URL Cloudflare Worker mới
   */
  async setEndpoint(newUrl) {
    let cleanUrl = (newUrl || '').trim();
    if (cleanUrl.endsWith('/')) {
      cleanUrl = cleanUrl.slice(0, -1);
    }
    this.endpoint = cleanUrl;
    await AsyncStorage.setItem(CF_ENDPOINT_KEY, cleanUrl);
    return cleanUrl;
  }

  /**
   * Kiểm tra kết nối đến Cloudflare D1
   */
  async checkHealth() {
    try {
      const baseUrl = await this.getEndpoint();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(`${baseUrl}/api/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        return { connected: true, data };
      }
      return { connected: false, error: `HTTP ${res.status}` };
    } catch (e) {
      return { connected: false, error: e.message };
    }
  }

  /**
   * Đăng ký tài khoản sinh viên lên Cloudflare D1
   */
  async register(userData) {
    try {
      const baseUrl = await this.getEndpoint();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const data = await res.json();
      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Đăng nhập xác thực với Cloudflare D1
   */
  async login(identifier, password) {
    try {
      const baseUrl = await this.getEndpoint();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const data = await res.json();
      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Lấy lịch sử đặt phòng từ Cloudflare D1
   */
  async getBookings(userId = null) {
    try {
      const baseUrl = await this.getEndpoint();
      const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`${baseUrl}/api/bookings${query}`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        return data.bookings || [];
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Lưu lượt đặt phòng mới lên Cloudflare D1
   */
  async createBooking(bookingData) {
    try {
      const baseUrl = await this.getEndpoint();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`${baseUrl}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const data = await res.json();
      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Cập nhật trạng thái đặt phòng trên Cloudflare D1
   */
  async updateBookingStatus(bookingId, status) {
    try {
      const baseUrl = await this.getEndpoint();
      const res = await fetch(`${baseUrl}/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  }
}

export const cloudflareApi = new CloudflareApiService();
