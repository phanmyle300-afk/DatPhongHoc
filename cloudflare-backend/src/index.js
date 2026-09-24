/**
 * CLOUDFLARE WORKER REST API KẾT NỐI CLOUDFLARE D1 DATABASE
 * Quản lý xác thực sinh viên & lịch sử đặt phòng học trực tuyến VKU
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Cấu hình CORS headers cho ứng dụng di động & Web
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json',
    };

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders, status: 204 });
    }

    try {
      const db = env.DB; // Binding Cloudflare D1 Database

      // 1. HEALTH CHECK
      if (path === '/api/health' && method === 'GET') {
        return new Response(
          JSON.stringify({
            status: 'ok',
            database: 'Cloudflare D1',
            region: 'Edge Serverless',
            timestamp: new Date().toISOString(),
          }),
          { headers: corsHeaders, status: 200 }
        );
      }

      // 2. ĐĂNG KÝ TÀI KHOẢN SINH VIÊN (POST /api/auth/register)
      if (path === '/api/auth/register' && method === 'POST') {
        const body = await request.json();
        const {
          studentId,
          name,
          email,
          password,
          faculty = 'Khoa Khoa học Máy tính',
          major = 'Kỹ thuật Phần mềm',
          className = '24IT1',
          avatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
        } = body;

        const cleanStudentId = (studentId || '').trim().toUpperCase();
        const cleanEmail = (email || '').trim().toLowerCase();

        if (!cleanStudentId || !name || !cleanEmail || !password) {
          return new Response(
            JSON.stringify({ success: false, error: 'Thiếu thông tin đăng ký bắt buộc!' }),
            { headers: corsHeaders, status: 400 }
          );
        }

        // Kiểm tra trùng lặp trên Cloudflare D1
        const existing = await db
          .prepare('SELECT id FROM users WHERE student_id = ? OR email = ?')
          .bind(cleanStudentId, cleanEmail)
          .first();

        if (existing) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Mã sinh viên hoặc Email này đã tồn tại trên Cloudflare Database!',
            }),
            { headers: corsHeaders, status: 400 }
          );
        }

        const userId = `user_${Date.now()}`;
        const createdAt = new Date().toISOString();

        // Ghi vào Cloudflare D1
        await db
          .prepare(
            `INSERT INTO users (id, student_id, name, email, password, faculty, major, class_name, avatar, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(userId, cleanStudentId, name.trim(), cleanEmail, password.trim(), faculty, major, className, avatar, createdAt)
          .run();

        const newUser = {
          id: userId,
          studentId: cleanStudentId,
          name: name.trim(),
          email: cleanEmail,
          faculty,
          major,
          class: className,
          avatar,
          createdAt,
        };

        return new Response(
          JSON.stringify({ success: true, user: newUser }),
          { headers: corsHeaders, status: 201 }
        );
      }

      // 3. ĐĂNG NHẬP SINH VIÊN (POST /api/auth/login)
      if (path === '/api/auth/login' && method === 'POST') {
        const body = await request.json();
        const { identifier, password } = body;

        const cleanId = (identifier || '').trim().toLowerCase();
        const cleanPass = (password || '').trim();

        // Truy vấn xác thực từ Cloudflare D1
        const user = await db
          .prepare(
            `SELECT id, student_id as studentId, name, email, faculty, major, class_name as class, avatar, created_at as createdAt
             FROM users
             WHERE (LOWER(student_id) = ? OR LOWER(email) = ?) AND password = ?`
          )
          .bind(cleanId, cleanId, cleanPass)
          .first();

        if (!user) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Mã sinh viên/Email hoặc Mật khẩu không chính xác trên Cloudflare!',
            }),
            { headers: corsHeaders, status: 401 }
          );
        }

        return new Response(
          JSON.stringify({ success: true, user }),
          { headers: corsHeaders, status: 200 }
        );
      }

      // 4. DANH SÁCH SINH VIÊN (GET /api/users)
      if (path === '/api/users' && method === 'GET') {
        const { results } = await db
          .prepare(
            `SELECT id, student_id as studentId, name, email, faculty, major, class_name as class, avatar
             FROM users ORDER BY created_at DESC`
          )
          .all();

        return new Response(
          JSON.stringify({ success: true, users: results || [] }),
          { headers: corsHeaders, status: 200 }
        );
      }

      // 5. LẤY LỊCH SỬ ĐẶT PHÒNG (GET /api/bookings)
      if (path === '/api/bookings' && method === 'GET') {
        const userId = url.searchParams.get('userId');

        let query = `
          SELECT id, booking_code as bookingCode, room_id as roomId, room_code as roomCode,
                 room_name as roomName, building, floor, user_id as userId, user_name as userName,
                 student_id as studentId, date_str as dateStr, slot_id as slotId, slot_time as slotTime,
                 purpose, student_count as studentCount, status, notification_id as notificationId,
                 created_at as createdAt
          FROM bookings
        `;

        let result;
        if (userId) {
          query += ' WHERE user_id = ? ORDER BY created_at DESC';
          result = await db.prepare(query).bind(userId).all();
        } else {
          query += ' ORDER BY created_at DESC';
          result = await db.prepare(query).all();
        }

        return new Response(
          JSON.stringify({ success: true, bookings: result.results || [] }),
          { headers: corsHeaders, status: 200 }
        );
      }

      // 6. TẠO LƯỢT ĐẶT PHÒNG MỚI (POST /api/bookings) - CHỐNG XUNG ĐỘT TRÊN D1
      if (path === '/api/bookings' && method === 'POST') {
        const booking = await request.json();
        const {
          roomId,
          roomCode,
          roomName,
          building,
          floor,
          userId,
          userName,
          studentId,
          dateStr,
          slotId,
          slotTime,
          purpose,
          studentCount,
          bookingCode,
          notificationId,
        } = booking;

        // Kiểm tra xung đột 1: Ca học này tại phòng này đã có ai đặt chưa?
        const roomConflict = await db
          .prepare(
            `SELECT id FROM bookings
             WHERE room_id = ? AND date_str = ? AND slot_id = ? AND status = 'active'`
          )
          .bind(roomId, dateStr, slotId)
          .first();

        if (roomConflict) {
          return new Response(
            JSON.stringify({
              success: false,
              error: `Ca học này tại phòng ${roomCode} đã được một sinh viên khác đặt trên Cloudflare!`,
            }),
            { headers: corsHeaders, status: 409 }
          );
        }

        // Kiểm tra xung đột 2: Sinh viên này đã có lịch đặt khác trong cùng ca không?
        const userConflict = await db
          .prepare(
            `SELECT id FROM bookings
             WHERE user_id = ? AND date_str = ? AND slot_id = ? AND status = 'active'`
          )
          .bind(userId, dateStr, slotId)
          .first();

        if (userConflict) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Bạn đã có một lịch đặt phòng học khác trong cùng khung giờ này!',
            }),
            { headers: corsHeaders, status: 409 }
          );
        }

        const id = booking.id || `cf_bk_${Date.now()}`;
        const createdAt = new Date().toISOString();

        // Ghi dữ liệu vào bảng bookings của Cloudflare D1
        await db
          .prepare(
            `INSERT INTO bookings (
              id, booking_code, room_id, room_code, room_name, building, floor,
              user_id, user_name, student_id, date_str, slot_id, slot_time,
              purpose, student_count, status, notification_id, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`
          )
          .bind(
            id,
            bookingCode,
            roomId,
            roomCode,
            roomName,
            building,
            floor,
            userId,
            userName,
            studentId,
            dateStr,
            slotId,
            slotTime,
            purpose,
            studentCount,
            notificationId || '',
            createdAt
          )
          .run();

        const createdBooking = {
          ...booking,
          id,
          status: 'active',
          createdAt,
        };

        return new Response(
          JSON.stringify({ success: true, booking: createdBooking }),
          { headers: corsHeaders, status: 201 }
        );
      }

      // 7. CẬP NHẬT TRẠNG THÁI ĐẶT PHÒNG (PATCH /api/bookings/:id)
      if (path.startsWith('/api/bookings/') && (method === 'PATCH' || method === 'PUT')) {
        const bookingId = path.split('/').pop();
        const { status } = await request.json();

        if (!['active', 'completed', 'cancelled'].includes(status)) {
          return new Response(
            JSON.stringify({ success: false, error: 'Trạng thái không hợp lệ!' }),
            { headers: corsHeaders, status: 400 }
          );
        }

        await db
          .prepare('UPDATE bookings SET status = ? WHERE id = ?')
          .bind(status, bookingId)
          .run();

        return new Response(
          JSON.stringify({ success: true, bookingId, status }),
          { headers: corsHeaders, status: 200 }
        );
      }

      // Route không tồn tại
      return new Response(
        JSON.stringify({ error: 'Endpoint không tồn tại trên Cloudflare Worker API' }),
        { headers: corsHeaders, status: 404 }
      );
    } catch (err) {
      console.error('Cloudflare Worker Error:', err);
      return new Response(
        JSON.stringify({ success: false, error: err.message || 'Lỗi xử lý máy chủ Cloudflare' }),
        { headers: corsHeaders, status: 500 }
      );
    }
  },
};
