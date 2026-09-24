# Hướng dẫn Triển khai Cơ sở dữ liệu Cloudflare D1 & Worker

Hệ thống cơ sở dữ liệu trực tuyến của ứng dụng được xây dựng trên **Cloudflare D1** (Serverless SQL Database miễn phí tại Edge) và **Cloudflare Workers**.

---

## 🚀 3 Bước Deploy lên Cloudflare hoàn toàn Miễn phí:

### Bước 1: Đăng nhập Cloudflare bằng Wrangler
Mở terminal tại thư mục `cloudflare-backend`:
```bash
npx wrangler login
```

### Bước 2: Tạo Cơ sở dữ liệu Cloudflare D1 và chạy Schema
1. Tạo database D1 mới:
```bash
npx wrangler d1 create vku-booking-db
```
*Lệnh trên sẽ in ra `database_id` (ví dụ: `xxxx-xxxx-xxxx`). Bạn hãy sao chép `database_id` này và dán vào tệp `wrangler.toml`.*

2. Thực thi khởi tạo các bảng `users`, `bookings`, `rooms`:
```bash
npx wrangler d1 execute vku-booking-db --remote --file=./schema.sql
```

### Bước 3: Deploy Cloudflare Worker API
```bash
npx wrangler deploy
```

Sau khi deploy, Cloudflare sẽ cấp cho bạn một đường dẫn URL dạng:
👉 `https://vku-room-booking-api.<your-subdomain>.workers.dev`

Bạn chỉ cần nhập đường dẫn này vào màn hình **Cá nhân > Cấu hình Cloudflare D1** trên ứng dụng, toàn bộ tài khoản đăng ký và lịch sử đặt phòng sẽ tự động được lưu trữ trực tiếp trên Cloudflare!

---

## ⚡ Các API Endpoints được Cloudflare Worker cung cấp:

- `POST /api/auth/register`: Đăng ký tài khoản sinh viên mới vào Cloudflare D1.
- `POST /api/auth/login`: Xác thực đăng nhập sinh viên.
- `GET  /api/users`: Lấy danh sách tài khoản đã đăng ký.
- `GET  /api/bookings`: Lấy danh sách đặt phòng và lịch sử từ Cloudflare D1.
- `POST /api/bookings`: Đặt phòng mới và kiểm tra chống xung đột khung giờ trên Cloudflare.
- `PATCH /api/bookings/:id`: Hủy đặt phòng hoặc check-in.
- `GET  /api/health`: Kiểm tra trạng thái máy chủ Cloudflare D1.
