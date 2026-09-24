const fs = require('fs');

// Danh sách ảnh phòng học thực tế chất lượng cao
const ROOM_IMAGES = [
  'https://images.unsplash.com/photo-1562774053-701939374585?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop&q=80',
];

const BUILDINGS = [
  {
    code: 'V',
    name: 'Tòa nhà V - Công nghệ Thông tin & AI',
    manager: 'Khoa Khoa học Máy tính',
    roomTypes: [
      'Lab AI & Học máy',
      'Lab Lập trình Game & Đồ họa',
      'Smart Classroom CNTT',
      'Lab Điện toán Đám mây & DevOps',
      'Lab An toàn Thông tin & Cyber Security',
      'Lab Công nghệ Phần mềm',
      'Phòng Hội thảo Công nghệ cao',
      'Lab Xử lý Dữ liệu lớn Big Data',
    ],
    pcSpecs: [
      'PC Core i9-14900K, GPU RTX 4080 16GB, RAM 64GB, Màn hình 27 inch 2K 165Hz.',
      'PC Core i7-14700K, GPU RTX 4070 Ti 12GB, RAM 32GB, Bảng vẽ Wacom Pro.',
      'PC Intel Xeon W-2400, GPU Dual RTX 4090 24GB chuyên AI Deep Learning.',
      'PC Core i7-13700, RAM 32GB, SSD NVMe 1TB, Màn hình Dell UltraSharp 4K.',
    ],
  },
  {
    code: 'A',
    name: 'Tòa nhà A - Trung tâm Hành chính & Hội thảo',
    manager: 'Phòng Đào tạo VKU',
    roomTypes: [
      'Phòng Học thông minh Smart Classroom',
      'Phòng Thảo luận Dự án Khởi nghiệp',
      'Hội trường Hội thảo Đa phương tiện',
      'Phòng Bảo vệ Khóa luận Tốt nghiệp',
      'Phòng Seminar Học thuật',
      'Phòng Gặp gỡ Doanh nghiệp & Tuyển dụng',
      'Phòng Học Tương tác Nhóm linh hoạt',
      'Phòng Trực tuyến Hybrid Learning',
    ],
    pcSpecs: [
      'Màn hình tương tác ViewSonic 86 inch 4K, Hệ thống âm thanh hội nghị đa hướng JBL.',
      'Hệ thống Video Conference Polycom Studio 4K, 2 Màn hình TV 75 inch.',
      'Smartboard cảm ứng đa điểm, Micro cổ ngỗng không dây Shure, Bảng kính cường lực.',
      'Máy chiếu Laser Sony 6000 Lumens, Âm thanh vòm Bose, Hệ thống Podium thông minh.',
    ],
  },
  {
    code: 'B',
    name: 'Tòa nhà B - Điện tử & Kỹ thuật Máy tính',
    manager: 'Khoa Kỹ thuật Máy tính & Điện tử',
    roomTypes: [
      'Lab Mạng máy tính & Viễn thông Cisco',
      'Lab Hệ thống Nhúng & IoT',
      'Lab Vi cơ điện tử & Robot tự hành',
      'Lab Thiết kế Vi mạch & Bán dẫn',
      'Lab Kỹ thuật Vi điều khiển ARM',
      'Smart Classroom Kỹ thuật',
      'Phòng Thiết kế Mạch in PCB Altium',
      'Lab Công nghệ Không dây & 5G',
    ],
    pcSpecs: [
      'Tủ Rack Router Cisco Catalyst 3850, Switch Cisco 2960, PC Core i7-13700.',
      'Bộ Kit FPGA Xilinx Zynq-7000, Máy đo sóng Oscilloscope Tektronix, PC Core i7.',
      'Trạm thực hành Robot ABB & Kuka, Bộ cảm biến LiDAR 3D, Máy tính nhúng Jetson Orin.',
      'Trạm làm việc Workstation HP Z4 chuyên mô phỏng Cadence & Synopsys vi mạch.',
    ],
  },
  {
    code: 'C',
    name: 'Tòa nhà C - Kinh tế số & Thương mại điện tử',
    manager: 'Khoa Kinh tế số & TMĐT',
    roomTypes: [
      'Phòng Thực hành Kinh doanh số & E-Commerce',
      'Phòng Thực hành Công nghệ Tài chính Fintech',
      'Studio Livestream Bán hàng & Marketing số',
      'Smart Classroom Quản trị Kinh doanh',
      'Phòng Đàm phán Thương mại Quốc tế',
      'Lab Phân tích Dữ liệu Kinh doanh BI',
      'Phòng Mô phỏng Sàn Giao dịch Chứng khoán',
      'Phòng Thuyết trình Dự án Starup',
    ],
    pcSpecs: [
      'Hệ sinh thái Phần mềm ERP SAP, Máy tính All-in-One HP Core i5-13500, RAM 16GB.',
      'Studio chuyên nghiệp: Máy quay Sony Alpha 4K, Đèn Softbox Godox, Micro Rode PodMic.',
      'Trạm theo dõi thị trường tài chính màn hình UltraWide kép 34 inch, Bloomberg Terminal.',
      'Hệ thống bảng tương tác cảm ứng Samsung Flip Pro 85 inch, Bàn ghế xoay module.',
    ],
  },
  {
    code: 'K',
    name: 'Tòa nhà K - Ngoại ngữ & Kỹ năng số Toàn cầu',
    manager: 'Khoa Ngoại ngữ & Kỹ năng số',
    roomTypes: [
      'Lab Ngoại ngữ Tương tác Đa phương tiện',
      'Phòng Luyện thi Chuẩn quốc tế IELTS / TOEIC',
      'Phòng Giao lưu Văn hóa & Ngôn ngữ Hàn Quốc',
      'Phòng Thực hành Kỹ năng Thuyết trình Tiếng Anh',
      'Smart Classroom Ngoại ngữ 4.0',
      'Phòng Dịch thuật Cabin Đa ngôn ngữ',
      'Phòng Hội thảo Quốc tế Global Campus',
      'Không gian Mở Tự học Ngoại ngữ',
    ],
    pcSpecs: [
      'Hệ thống Tai nghe chống ồn Sony chuyên dụng luyện nghe, PC Core i5-13400, Màn hình 24".',
      'Hệ thống Cabin dịch song song 4 kênh truyền thanh, Micro Bosch DCN, Màn hình phụ.',
      'Bàn tròn tương tác mô hình Oxford, Bảng tương tác thông minh, Âm thanh vòm Yamaha.',
      'Trạm làm việc All-in-One kết nối thư viện số tài liệu học tập toàn cầu Cambridge.',
    ],
  },
];

// Sinh danh sách 100 phòng học (20 phòng mỗi tòa nhà A, B, C, K, V)
const rooms = [];
let roomIndex = 1;

for (const b of BUILDINGS) {
  // Mỗi tòa 20 phòng trải đều từ tầng 1 đến tầng 5 (mỗi tầng 4 phòng)
  for (let floor = 1; floor <= 5; floor++) {
    for (let num = 1; num <= 4; num++) {
      const roomNum = `${floor}0${num}`;
      const code = `${b.code}.${roomNum}`;
      const typeIndex = (floor * 2 + num) % b.roomTypes.length;
      const typeName = b.roomTypes[typeIndex];
      const name = `${typeName} ${code}`;
      const id = `room_${b.code.toLowerCase()}_${roomNum}`;

      const capacityOptions = [16, 20, 24, 30, 35, 45, 60, 80];
      const capacity = capacityOptions[(floor + num * 2) % capacityOptions.length];

      const pcSpec = b.pcSpecs[(num + floor) % b.pcSpecs.length];
      const image = ROOM_IMAGES[(roomIndex - 1) % ROOM_IMAGES.length];

      const amenitiesList = [
        'Máy chiếu',
        'Điều hòa',
        'Bảng trắng',
        'Wifi tốc độ cao',
      ];
      if (b.code === 'V' || b.code === 'B') {
        amenitiesList.unshift('Máy tính cấu hình cao');
      } else if (b.code === 'C' && typeName.includes('Studio')) {
        amenitiesList.push('Hệ thống Livestream 4K');
      } else if (b.code === 'K' && typeName.includes('Cabin')) {
        amenitiesList.push('Cabin dịch Cabin song song');
      }

      const rating = Number((4.6 + ((num + floor) % 5) * 0.08).toFixed(1));
      const reviewsCount = 15 + ((floor * 11 + num * 7) % 65);

      rooms.push({
        id,
        code,
        name,
        building: b.code,
        buildingName: b.name,
        floor: `Tầng ${floor}`,
        capacity,
        isAvailableNow: (roomIndex % 3 !== 0), // xen kẽ phòng đang trống
        rating: Math.min(5.0, rating),
        reviewsCount,
        description: `Phòng học tiêu chuẩn quốc tế tại Đại học VKU. Không gian rộng rãi, thoáng mát, hệ thống điều hòa 24/7 và mạng Internet cáp quang chuyên dụng.`,
        amenities: amenitiesList,
        specs: pcSpec,
        image,
        manager: b.manager,
      });

      roomIndex++;
    }
  }
}

console.log(`Đã tạo thành công ${rooms.length} phòng học!`);

// 1. Ghi vào src/data/mockRooms.js
const mockRoomsContent = `// Danh sách 100 phòng học và phòng Lab tiêu chuẩn tại khuôn viên Đại học VKU
export const MOCK_ROOMS = ${JSON.stringify(rooms, null, 2)};
`;
fs.writeFileSync('./src/data/mockRooms.js', mockRoomsContent, 'utf8');
console.log('✅ Đã cập nhật src/data/mockRooms.js với 100 phòng học.');

// 2. Cập nhật src/database/schema.js: để trống USERS và BOOKINGS
const schemaContent = `// Định nghĩa Schema và Dữ liệu hạt giống khởi tạo cho Cơ sở dữ liệu VKU
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
`;
fs.writeFileSync('./src/database/schema.js', schemaContent, 'utf8');
console.log('✅ Đã cập nhật src/database/schema.js: users = [] và bookings = [].');

// 3. Cập nhật firebase-database-seed.json
const seedObj = {
  rooms: {},
  users: {},
  bookings: {}
};
rooms.forEach(r => {
  seedObj.rooms[r.id] = r;
});

fs.writeFileSync('./firebase-database-seed.json', JSON.stringify(seedObj, null, 2), 'utf8');
console.log('✅ Đã cập nhật firebase-database-seed.json với 100 phòng học.');

// 4. Đẩy trực tiếp lên Firebase Realtime Database
const FIREBASE_DB_URL = 'https://datphonghoc-default-rtdb.firebaseio.com';

async function updateLiveFirebase() {
  console.log('Đang đẩy 100 phòng học lên Firebase Realtime Database...');

  // Nạp 100 rooms
  const roomsRes = await fetch(`${FIREBASE_DB_URL}/rooms.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(seedObj.rooms)
  });
  console.log('Kết quả cập nhật Rooms lên Firebase:', roomsRes.ok ? 'Thành công (100 phòng)' : 'Thất bại');

  // Xóa sạch users mẫu trên Firebase
  const usersRes = await fetch(`${FIREBASE_DB_URL}/users.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(null) // xóa rỗng
  });
  console.log('Kết quả xóa sạch Users mẫu trên Firebase:', usersRes.ok ? 'Đã dọn dẹp sạch (để trống cho bạn đăng ký)' : 'Thất bại');

  // Xóa sạch bookings mẫu trên Firebase
  const bookingsRes = await fetch(`${FIREBASE_DB_URL}/bookings.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(null) // xóa rỗng
  });
  console.log('Kết quả xóa sạch Bookings mẫu trên Firebase:', bookingsRes.ok ? 'Đã dọn dẹp sạch (để trống cho bạn tự đặt)' : 'Thất bại');

  // Kiểm tra lại dữ liệu trên Firebase
  const checkRooms = await fetch(`${FIREBASE_DB_URL}/rooms.json?shallow=true`).then(r => r.json());
  const checkUsers = await fetch(`${FIREBASE_DB_URL}/users.json`).then(r => r.json());
  const checkBookings = await fetch(`${FIREBASE_DB_URL}/bookings.json`).then(r => r.json());

  console.log('\n=== KẾT QUẢ FIREBASE LIVE SAU KHI CẬP NHẬT ===');
  console.log('- Số lượng phòng học trên Firebase:', checkRooms ? Object.keys(checkRooms).length : 0);
  console.log('- Số lượng tài khoản trên Firebase:', checkUsers ? Object.keys(checkUsers).length : 0, '(Sạch sẽ để bạn tự tạo)');
  console.log('- Số lượng lịch đặt phòng trên Firebase:', checkBookings ? Object.keys(checkBookings).length : 0, '(Sạch sẽ để bạn tự đặt)');
}

updateLiveFirebase().catch(e => console.error('Lỗi đẩy Firebase:', e));
