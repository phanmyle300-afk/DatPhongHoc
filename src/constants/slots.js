// Định nghĩa các ca học 2 tiếng chuẩn tại VKU
export const TIME_SLOTS = [
  {
    id: 'slot_1',
    name: 'Ca 1 (Sáng)',
    startTime: '07:30',
    endTime: '09:30',
    startHour: 7,
    startMinute: 30,
    session: 'morning',
  },
  {
    id: 'slot_2',
    name: 'Ca 2 (Sáng)',
    startTime: '09:30',
    endTime: '11:30',
    startHour: 9,
    startMinute: 30,
    session: 'morning',
  },
  {
    id: 'slot_3',
    name: 'Ca 3 (Chiều)',
    startTime: '13:00',
    endTime: '15:00',
    startHour: 13,
    startMinute: 0,
    session: 'afternoon',
  },
  {
    id: 'slot_4',
    name: 'Ca 4 (Chiều)',
    startTime: '15:00',
    endTime: '17:00',
    startHour: 15,
    startMinute: 0,
    session: 'afternoon',
  },
  {
    id: 'slot_5',
    name: 'Ca 5 (Tối)',
    startTime: '17:30',
    endTime: '19:30',
    startHour: 17,
    startMinute: 30,
    session: 'evening',
  },
];

export const BUILDINGS = [
  { id: 'ALL', name: 'Tất cả tòa', label: 'Tất cả' },
  { id: 'V', name: 'Tòa V (CNTT & AI)', label: 'Tòa V' },
  { id: 'A', name: 'Tòa A (Hành chính & Smart Room)', label: 'Tòa A' },
  { id: 'B', name: 'Tòa B (An toàn thông tin & Mạng)', label: 'Tòa B' },
  { id: 'C', name: 'Tòa C (Thư viện & Tự học)', label: 'Tòa C' },
];

export const AMENITIES_LIST = [
  { id: 'projector', name: 'Máy chiếu', icon: 'projector' },
  { id: 'whiteboard', name: 'Bảng trắng', icon: 'presentation' },
  { id: 'high_spec_pc', name: 'Máy tính cấu hình cao', icon: 'desktop-tower' },
  { id: 'air_conditioner', name: 'Điều hòa', icon: 'air-conditioner' },
];
