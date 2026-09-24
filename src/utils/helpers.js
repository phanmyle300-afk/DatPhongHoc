// Các hàm tiện ích hỗ trợ định dạng ngày tháng, sinh mã đặt phòng và tính toán thời gian
import { TIME_SLOTS } from '../constants/slots';

/**
 * Sinh mã đặt chỗ duy nhất định dạng: VKU-[RoomCode]-[YYMMDD]-[RandomHex]
 * Ví dụ: VKU-V301-260911-8A9C
 */
export const generateBookingCode = (roomCode) => {
  const cleanCode = roomCode.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `VKU-${cleanCode}-${year}${month}${day}-${randomChars}`;
};

/**
 * Lấy danh sách 7 ngày liên tiếp từ ngày hiện tại
 */
export const getNext7Days = () => {
  const days = [];
  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const fullDayNames = [
    'Chủ Nhật',
    'Thứ Hai',
    'Thứ Ba',
    'Thứ Tư',
    'Thứ Năm',
    'Thứ Sáu',
    'Thứ Bảy',
  ];

  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + i);

    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`; // Format YYYY-MM-DD

    const dayOfWeek = targetDate.getDay();
    const isToday = i === 0;
    const isTomorrow = i === 1;

    let displayLabel = isToday ? 'Hôm nay' : isTomorrow ? 'Ngày mai' : dayNames[dayOfWeek];

    days.push({
      index: i,
      dateStr,
      dayNumber: String(targetDate.getDate()),
      monthNumber: String(targetDate.getMonth() + 1),
      dayLabel: displayLabel,
      fullDayName: isToday ? 'Hôm nay' : isTomorrow ? 'Ngày mai' : fullDayNames[dayOfWeek],
      dayOfWeek: dayNames[dayOfWeek],
      dateObj: targetDate,
    });
  }

  return days;
};

/**
 * Tính toán thời điểm bắt đầu ca học (Date object)
 */
export const getSlotStartTime = (dateStr, slotId) => {
  const slot = TIME_SLOTS.find((s) => s.id === slotId);
  if (!slot) return null;

  const [year, month, day] = dateStr.split('-').map(Number);
  const startTime = new Date(year, month - 1, day, slot.startHour, slot.startMinute, 0);
  return startTime;
};

/**
 * Tính toán thời điểm gửi thông báo (15 phút trước giờ bắt đầu ca học)
 */
export const getReminderNotificationTime = (dateStr, slotId) => {
  const startTime = getSlotStartTime(dateStr, slotId);
  if (!startTime) return null;

  // Trừ 15 phút
  const reminderTime = new Date(startTime.getTime() - 15 * 60 * 1000);
  return reminderTime;
};

/**
 * Format ngày hiển thị dạng DD/MM/YYYY
 */
export const formatDateDisplay = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};
