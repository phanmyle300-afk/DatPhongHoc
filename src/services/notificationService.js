// Dịch vụ quản lý thông báo cục bộ với expo-notifications
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { getReminderNotificationTime, getSlotStartTime } from '../utils/helpers';
import { TIME_SLOTS } from '../constants/slots';

// Cấu hình handler để hiển thị banner thông báo ngay cả khi ứng dụng đang mở
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch (e) {
  console.warn('Notifications handler setup warning:', e.message);
}

/**
 * Yêu cầu quyền gửi thông báo từ người dùng
 */
export const requestNotificationPermissions = async () => {
  if (Platform.OS === 'web') {
    return true; // Web notification mock/browser support
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Quyền gửi thông báo chưa được cấp');
      return false;
    }

    // Với Android cần thiết lập Notification Channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('vku-room-booking', {
        name: 'Nhắc nhở nhận phòng VKU',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#003B73',
      });
    }

    return true;
  } catch (error) {
    console.warn('Error requesting notification permissions:', error);
    return false;
  }
};

/**
 * Lên lịch thông báo nhắc nhở trước 15 phút ca học
 */
export const scheduleRoomReminder = async ({ bookingId, roomName, roomCode, dateStr, slotId }) => {
  try {
    const slot = TIME_SLOTS.find((s) => s.id === slotId);
    const slotLabel = slot ? `${slot.startTime} - ${slot.endTime}` : '';
    const reminderTime = getReminderNotificationTime(dateStr, slotId);
    const now = new Date();

    const title = '⏰ Nhắc nhở nhận phòng học VKU!';
    const body = `Ca học tại ${roomCode} (${roomName}) sẽ bắt đầu lúc ${slot?.startTime}. Vui lòng mở mã QR để check-in tại cửa phòng!`;

    // Nếu thời gian hẹn trong tương lai (> 15s kể từ hiện tại)
    if (reminderTime && reminderTime.getTime() > now.getTime() + 15000) {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { bookingId, roomCode, slotId, dateStr },
          sound: true,
        },
        trigger: {
          date: reminderTime,
          channelId: 'vku-room-booking',
        },
      });
      return notificationId;
    } else {
      // Nếu thời điểm đặt sát giờ hoặc mô phỏng: lên lịch thông báo demo sau 5 giây để kiểm thử
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `🔔 [VKU Demo] Đặt phòng thành công!`,
          body: `Phòng ${roomCode} đã được giữ chỗ lúc ${slotLabel}. Hệ thống sẽ nhắc bạn trước giờ ca học.`,
          data: { bookingId, roomCode, slotId, dateStr },
          sound: true,
        },
        trigger: {
          seconds: 5,
          channelId: 'vku-room-booking',
        },
      });
      return notificationId;
    }
  } catch (error) {
    console.warn('Không thể lên lịch thông báo:', error);
    return `mock-notif-${Date.now()}`;
  }
};

/**
 * Hủy thông báo đã lên lịch khi sinh viên hủy đặt phòng
 */
export const cancelScheduledReminder = async (notificationId) => {
  if (!notificationId || notificationId.startsWith('mock-')) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.warn('Lỗi khi hủy thông báo:', error);
  }
};
