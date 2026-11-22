# Cinema Manage System

Website đặt vé xem phim và quản lý lịch chiếu.
**Backend: PHP 8.1+ (PDO) + MySQL 8** · Frontend: HTML/CSS/JavaScript · Trang quản trị: PHP.

## Chức năng

### Trang người dùng
- Trang chủ (banner, phim đang chiếu/sắp chiếu), danh sách phim có **lọc** và **phân trang**, tìm kiếm tức thì.
- Chi tiết phim: thông tin, nội dung định dạng, trailer YouTube, **bộ ảnh phim**, lịch chiếu theo ngày/rạp.
- **Đăng ký, đăng nhập, đăng xuất** (session PHP, mật khẩu mã hóa bcrypt).
- Đặt vé: chọn ghế (thường/VIP/đôi), **giữ ghế 15 phút trên server**, thanh toán, vé điện tử có mã QR.
- Chống đặt trùng ghế: hai tài khoản cùng chọn một ghế thì chỉ người đến trước đặt được (ràng buộc unique trong MySQL).

### Trang quản trị (`/admin`) — chỉ tài khoản có vai trò `admin`
| Mục | Chức năng |
|---|---|
| Tổng quan | Thống kê doanh thu, vé bán, biểu đồ doanh thu 7 ngày, phim bán chạy |
| Phim | CRUD, tìm kiếm, lọc, **phân trang**, upload poster + **upload nhiều ảnh**, **editor** soạn nội dung (Quill) |
| Suất chiếu | CRUD, lọc theo phim/rạp/ngày/trạng thái, tự tính giờ kết thúc, chặn trùng giờ trong phòng |
| Rạp chiếu | CRUD, tìm kiếm, phân trang |
| Phòng & ghế | CRUD phòng, tự sinh sơ đồ ghế, sửa loại ghế, thêm/xóa ghế |
| Đơn đặt vé | Xem, lọc, chi tiết vé & thanh toán, hủy đơn (mở lại ghế), xóa đơn |
| Người dùng | CRUD, **phân quyền** (khách hàng / quản trị viên), đổi mật khẩu |

### Bảo mật
- Truy vấn tham số hóa (PDO prepared statements) chống SQL injection.
- Escape dữ liệu khi hiển thị, lọc HTML của editor theo danh sách thẻ cho phép (chống XSS).
- CSRF token cho mọi form admin, API chỉ nhận JSON.
- Upload kiểm tra định dạng thật của file (finfo), đổi tên ngẫu nhiên, không cho chạy script trong `uploads/`.
- Đổi session ID khi đăng nhập, cookie `HttpOnly` + `SameSite=Lax`.

## Cài đặt (XAMPP)

1. Cài [XAMPP](https://www.apachefriends.org/) bản có **PHP 8.1 trở lên**.
   Nếu máy đã có MySQL 8 riêng thì chỉ cần bật **Apache** trong XAMPP.
2. Chép cả thư mục dự án vào `C:\xampp\htdocs\cinema` (tên thư mục tùy ý).
3. Tạo database: mở MySQL Workbench / phpMyAdmin, chạy lần lượt các file trong `sql/`:
   ```
   schema.sql → procedures.sql → triggers.sql → expire_bookings.sql
   → expire_bookings_event.sql → dummy_data.sql → seed_seats.sql → seed_extra_seats.sql
   ```
   Database đã tạo từ bản cũ: chạy thêm `migrate_frontend_schema.sql`
   (hoặc `DROP DATABASE cinema_management_dev;` rồi chạy lại từ đầu).
4. Nếu MySQL có mật khẩu: chép `.env.example` thành `.env` và điền `DB_PASSWORD`.
5. Mở trình duyệt:
   - Trang khách: http://localhost/cinema/
   - Trang quản trị: http://localhost/cinema/admin/

> Không mở file `.html` trực tiếp (file://) — khi đó web chỉ chạy dữ liệu mẫu, không có đăng nhập/đặt vé thật.

### Tài khoản mẫu
| Vai trò | Email | Mật khẩu |
|---|---|---|
| Quản trị viên | `admin@cinema.local` | `admin123` |
| Khách hàng | `customer@cinema.local` | `123456` |

**Đổi mật khẩu admin sau khi cài** (Admin → Người dùng → Sửa).

## Cấu trúc thư mục

```text
├── index.html, danhsach.html, chitiet.html,   # Trang người dùng
│   booking.html, checkout.html, e_ticket.html
├── css/, js/, assets/                         # Giao diện người dùng
├── api/                 # API JSON (PHP) cho trang người dùng
│   ├── auth.php         #   đăng ký / đăng nhập / đăng xuất / tài khoản hiện tại
│   ├── movies.php       #   danh sách + chi tiết phim (có phân trang)
│   ├── cinemas.php, shows.php, seats.php
│   └── bookings.php     #   giữ ghế, thanh toán, lịch sử đặt vé
├── admin/               # Trang quản trị (PHP)
│   ├── _layout.php      #   khung giao diện chung
│   ├── index.php        #   tổng quan
│   ├── movies.php, movie_form.php, shows.php, show_form.php,
│   │   cinemas.php, halls.php, hall_seats.php, bookings.php, users.php
│   └── assets/          #   CSS/JS admin (responsive, Quill editor, Chart.js)
├── includes/            # Lõi PHP: cấu hình, kết nối DB, đăng nhập, tiện ích
├── uploads/movies/      # Ảnh do admin upload
├── sql/                 # Schema, procedure, trigger, event, dữ liệu mẫu
└── docs/                # Tài liệu
    ├── PhanTichThietKe.md      # Phân tích thiết kế: use case, kiến trúc, luồng, ERD, mô tả bảng, bảo mật, API, kiểm thử
    ├── BaoCao_ThuyetTrinh.md   # Dàn ý slide, kịch bản demo, bảng phân công & đánh giá thành viên
    ├── diagrams/               # Sơ đồ (*.mmd sửa được trên mermaid.live, *.png để chèn slide)
    └── screenshots/            # Ảnh chụp giao diện
```

## API

| Phương thức | Đường dẫn | Mô tả |
|---|---|---|
| GET | `api/movies.php[?id=&page=&limit=]` | Danh sách / chi tiết phim |
| GET | `api/cinemas.php` | Danh sách rạp |
| GET | `api/shows.php[?movie_id=]` | Suất chiếu |
| GET | `api/seats.php?show_id=` | Sơ đồ ghế + trạng thái |
| GET | `api/auth.php?action=me` | Người đang đăng nhập |
| POST | `api/auth.php?action=register\|login\|logout` | Tài khoản |
| GET | `api/bookings.php` | Lịch sử đặt vé (cần đăng nhập) |
| POST | `api/bookings.php` `{action:"create", show_id, seat_ids}` | Giữ ghế |
| POST | `api/bookings.php` `{action:"pay", booking_id, method}` | Thanh toán |

## Tài liệu
- [Phân tích thiết kế hệ thống](docs/PhanTichThietKe.md) — use case, kiến trúc, luồng đặt vé, ERD và mô tả 10 bảng, bảo mật, API, kiểm thử.
- [Khung báo cáo thuyết trình](docs/BaoCao_ThuyetTrinh.md) — dàn ý 15 slide, kịch bản demo, bảng phân công và đánh giá thành viên.
