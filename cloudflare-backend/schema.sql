-- ============================================================
-- CLOUDFLARE D1 DATABASE SCHEMA CHO HỆ THỐNG ĐẶT PHÒNG HỌC VKU
-- ============================================================

-- 1. BẢNG USERS: Lưu trữ tài khoản sinh viên đăng ký
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    student_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    faculty TEXT DEFAULT 'Khoa Khoa học Máy tính',
    major TEXT DEFAULT 'Công nghệ Thông tin',
    class_name TEXT DEFAULT '22IT',
    avatar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_student_id ON users(student_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. BẢNG ROOMS: Danh mục phòng học & Lab tại VKU
CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    building TEXT NOT NULL,
    building_name TEXT NOT NULL,
    floor TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    is_available_now INTEGER DEFAULT 1,
    rating REAL DEFAULT 4.8,
    reviews_count INTEGER DEFAULT 20,
    description TEXT,
    amenities TEXT, -- Chuỗi JSON tiện ích
    specs TEXT,
    manager TEXT,
    image TEXT
);

CREATE INDEX IF NOT EXISTS idx_rooms_building ON rooms(building);

-- 3. BẢNG BOOKINGS: Lưu trữ toàn bộ lịch sử giao dịch đặt phòng
CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    booking_code TEXT UNIQUE NOT NULL,
    room_id TEXT NOT NULL,
    room_code TEXT NOT NULL,
    room_name TEXT NOT NULL,
    building TEXT NOT NULL,
    floor TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    student_id TEXT NOT NULL,
    date_str TEXT NOT NULL, -- Định dạng YYYY-MM-DD
    slot_id TEXT NOT NULL,  -- slot_1, slot_2,...
    slot_time TEXT NOT NULL,
    purpose TEXT NOT NULL,
    student_count INTEGER NOT NULL,
    status TEXT DEFAULT 'active', -- active | completed | cancelled
    notification_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (room_id) REFERENCES rooms(id)
);

CREATE INDEX IF NOT EXISTS idx_bookings_date_slot ON bookings(room_id, date_str, slot_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_code ON bookings(booking_code);

-- ============================================================
-- DỮ LIỆU HẠT GIỐNG BAN ĐẦU (SEED DATA)
-- ============================================================

INSERT OR IGNORE INTO users (id, student_id, name, email, password, faculty, major, class_name, avatar) VALUES
('user_22it089', '22IT089', 'Nguyễn Trần Minh Đức', 'ducntm.22it@vku.udn.vn', '123', 'Khoa Khoa học Máy tính', 'Kỹ thuật Phần mềm & AI', '22IT1', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'),
('user_23ba045', '23BA045', 'Lê Hoàng Khánh Linh', 'linhlhk.23ba@vku.udn.vn', '123', 'Khoa Kinh tế số & Thương mại điện tử', 'Quản trị Kinh doanh số', '23BA2', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80');

INSERT OR IGNORE INTO rooms (id, code, name, building, building_name, floor, capacity, is_available_now, specs, image) VALUES
('room_v301', 'V.301', 'Lab AI & Học máy V.301', 'V', 'Tòa V - CNTT & AI', 'Tầng 3', 20, 1, '20 PC Core i7, GPU RTX 4070 12GB, RAM 32GB', 'https://images.unsplash.com/photo-1562774053-701939374585?w=800&auto=format&fit=crop&q=80'),
('room_v402', 'V.402', 'Lab Lập trình Game & Đồ họa V.402', 'V', 'Tòa V - CNTT & AI', 'Tầng 4', 18, 0, '18 PC Core i9, RTX 4080, Bảng vẽ Wacom', 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80'),
('room_a102', 'A.102', 'Smart Classroom A.102', 'A', 'Tòa A - Hành chính & Hội thảo', 'Tầng 1', 16, 1, 'Smartboard cảm ứng 86", Âm thanh JBL', 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&auto=format&fit=crop&q=80'),
('room_b201', 'B.201', 'Lab Mạng & An toàn thông tin B.201', 'B', 'Tòa B - ATTT & Viễn thông', 'Tầng 2', 14, 0, '14 Trạm làm việc Kali Linux, Tủ mạng Cisco', 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80'),
('room_c101', 'C.101', 'Phòng Tự học Nhóm Thư viện C.101', 'C', 'Tòa C - Thư viện số', 'Tầng 1', 6, 1, 'Đèn LED chống mỏi mắt, Cổng sạc Type-C 65W', 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&auto=format&fit=crop&q=80');
