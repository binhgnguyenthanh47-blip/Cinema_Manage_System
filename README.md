# Cinema: website quản lý lịch chiếu phim

Website đặt vé xem phim và quản lý lịch chiếu, viết bằng Node.js (Express) và MySQL/MariaDB (XAMPP). Giao diện dùng HTML, CSS và JavaScript thuần.

## Cài đặt và chạy

### 1. Cần cài sẵn
- Node.js 18 trở lên (nên dùng bản LTS), tải ở [nodejs.org](https://nodejs.org). Cài xong thì khởi động lại VS Code.
- XAMPP, bật MySQL. Muốn dùng phpMyAdmin thì bật thêm Apache.

### 2. Tạo file `.env`
Chép `.env.example` thành `.env` ở thư mục gốc, rồi sửa theo máy của bạn:

```env
PORT=3000
NODE_ENV=development

DB_HOST=127.0.0.1
DB_PORT=3306          # cổng MySQL trong XAMPP (xem ở XAMPP Control Panel)
DB_USER=root
DB_PASSWORD=
DB_NAME=cinema_management

SESSION_SECRET=chuoi-ngau-nhien-bat-ky
```

### 3. Cài thư viện và chuẩn bị database
Mở terminal ở thư mục dự án (trong VS Code: Terminal → New Terminal), rồi chạy:

```bash
npm install          # cài thư viện (express, mysql2, bcryptjs, multer...), chỉ cần chạy 1 lần
npm run test-db      # kiểm tra kết nối MySQL và xem database đang có gì
```

Tiếp theo làm theo kết quả của `npm run test-db`:

| `test-db` báo | Chạy lệnh | Ghi chú |
|---|---|---|
| `Chưa có database` (máy mới, lần đầu cài) | `npm run db:init` | Tạo bảng, procedure, trigger và nạp dữ liệu mẫu |
| `Database đang là cấu trúc CŨ` | `npm run db:migrate` | Nâng cấp cấu trúc, **giữ nguyên dữ liệu** của nhóm |
| `CSDL chưa đầy đủ` (thiếu bảng hoặc procedure) | `npm run db:migrate`; nếu vẫn lỗi thì `npm run db:reset` | `db:reset` xóa database và tạo lại từ đầu |
| `Cơ sở dữ liệu sẵn sàng` | Không cần làm gì | Sang bước 4 |

> Chỉ chạy `npm run db:init` hoặc `npm run db:reset` khi chấp nhận **mất dữ liệu đang có**: hai lệnh này nạp lại dữ liệu mẫu.
> Muốn chạy tay trong phpMyAdmin thì chạy theo thứ tự: `schema.sql → procedures.sql → triggers.sql → expire_bookings.sql → expire_bookings_event.sql → dummy-data.sql → seed_seats.sql → seed_extra_seats.sql`.

### Chạy server (mỗi lần làm việc)
1. Mở XAMPP Control Panel, bấm **Start** ở dòng MySQL.
2. Ở terminal trong thư mục dự án, chạy `npm start`. Thấy dòng `Cinema đang chạy tại http://localhost:3000` là được.
3. Mở http://localhost:3000 trên trình duyệt.

Muốn tắt server thì bấm `Ctrl + C` ở terminal đang chạy `npm start`. Khi sửa code server, dùng `npm run dev` thay cho `npm start` để server tự khởi động lại. Sửa file HTML, CSS, JS ở giao diện thì chỉ cần tải lại trang (`Ctrl + F5`).

### 4. Đường dẫn để thử
| Trang | Đường dẫn |
|---|---|
| Trạng thái API + kết nối CSDL | http://localhost:3000/api |
| Dữ liệu phim từ MySQL | http://localhost:3000/api/movies |
| Trang chủ người dùng | http://localhost:3000 |
| Đăng nhập / Đăng ký | http://localhost:3000/auth.html |
| Trang quản trị (Admin) | http://localhost:3000/admin/index.html |

### Tài khoản mẫu
Có sẵn sau khi chạy `npm run db:init`. Database của nhóm dùng tài khoản riêng (quản trị viên: `admin@cinema.vn`).

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Quản trị viên | `admin@cinema.local` | `admin123` |
| Khách hàng | `customer@cinema.local` | `123456` |

Mã giảm giá dùng thử: `CINEMA20` (giảm 20.000đ), `UTH2026` (giảm 15%).

### Lệnh npm
| Lệnh | Tác dụng |
|---|---|
| `npm start` | Chạy server |
| `npm run dev` | Chạy server, tự khởi động lại khi sửa code |
| `npm run test-db` | Kiểm tra kết nối và các bảng trong CSDL |
| `npm run db:init` | Tạo bảng (nếu chưa có) + nạp lại dữ liệu mẫu |
| `npm run db:reset` | Xóa database rồi tạo lại từ đầu |
| `npm run db:migrate` | Nâng cấp database cũ lên cấu trúc mới, giữ dữ liệu |
| `npm run export-json` | Xuất dữ liệu mẫu ra `sql/dummy-data.json` |

### Lỗi thường gặp
| Hiện tượng | Cách xử lý |
|---|---|
| `ECONNREFUSED` | MySQL chưa bật, hoặc sai `DB_PORT` trong `.env` |
| `ER_ACCESS_DENIED_ERROR` | Sai `DB_USER` / `DB_PASSWORD` |
| `Chưa có database` | Chạy `npm run db:init` |
| `Database đang là cấu trúc CŨ` (DB của bản Node.js trước) | Chạy `npm run db:migrate`. Lệnh này nâng cấp cấu trúc và **giữ nguyên dữ liệu** |
| MySQL trong XAMPP bật lên rồi tắt ngay, log có `got exception 0xc0000005` | File log Aria bị hỏng. Tắt MySQL, **sao lưu** thư mục `xampp/mysql/data`, chuyển `aria_log.00000001` và `aria_log_control` ra chỗ khác, bật lại MySQL, rồi chạy `xampp/mysql/bin/mysql_upgrade.exe -uroot -P<cổng> --force` |
| `Cổng 3000 đang bị chiếm` | Đổi `PORT` trong `.env` hoặc tắt chương trình đang dùng cổng |
| Trang web báo "Không kết nối được cơ sở dữ liệu" | Xem log ở cửa sổ chạy `npm start` |

Đừng mở file `.html` trực tiếp (file://). Khi đó web chỉ hiện dữ liệu mẫu, không đăng nhập hay đặt vé được.

## Chức năng

### Trang người dùng
- Trang chủ có banner phim nổi bật và hai tab phim đang chiếu, sắp chiếu.
- Danh sách phim lọc được theo thể loại, cụm rạp, rạp và ngày chiếu, có phân trang. Ô tìm kiếm gợi ý ngay khi gõ.
- Trang chi tiết có trailer YouTube, nội dung soạn bằng editor, bộ ảnh phim và lịch chiếu theo ngày.
- Đăng ký, đăng nhập, đăng xuất. Mật khẩu mã hóa bcrypt, phiên đăng nhập là cookie HttpOnly lưu trong MySQL.
- Đặt vé trên sơ đồ ghế (thường, VIP, đôi), giá cập nhật khi chọn ghế. Server giữ ghế 15 phút trong lúc khách thanh toán. Có combo bắp nước, mã giảm giá và vé điện tử kèm mã QR.
- Hai người cùng chọn một ghế thì chỉ người bấm trước đặt được (unique key và procedure trong MySQL).

### Trang quản trị (`/admin`), chỉ dành cho tài khoản vai trò `admin`
| Mục | Chức năng |
|---|---|
| Tổng quan | Doanh thu, số vé bán, biểu đồ doanh thu 7 hoặc 30 ngày, doanh thu theo phim và theo rạp, phim bán chạy |
| Phim | CRUD, tìm kiếm, lọc, phân trang, upload poster và nhiều ảnh cùng lúc, soạn nội dung bằng editor Quill |
| Lịch chiếu | CRUD, lọc theo phim/rạp/ngày/trạng thái, tự tính giờ kết thúc, chặn hai suất trùng giờ trong một phòng |
| Rạp chiếu | CRUD, tìm kiếm, phân trang |
| Phòng & ghế | CRUD phòng, tự sinh sơ đồ ghế, đổi loại ghế, thêm/xóa ghế |
| Đơn đặt vé | Xem, lọc, chi tiết vé & thanh toán, hủy đơn (mở lại ghế), xóa đơn |
| Người dùng | CRUD, phân quyền khách hàng / quản trị viên, đổi mật khẩu |

### Bảo mật
- Truy vấn tham số hóa (mysql2) chống SQL injection.
- Escape dữ liệu khi hiển thị; HTML của editor lọc bằng `sanitize-html` (chống XSS).
- Chống CSRF: API chỉ nhận JSON hoặc request có header `X-Requested-With`; cookie `SameSite=Lax`.
- Upload kiểm tra định dạng thật của file (magic bytes), đổi tên ngẫu nhiên, giới hạn 5 MB/ảnh.
- Đổi session ID khi đăng nhập; quyền admin kiểm tra lại từ CSDL ở mỗi request.
- Server chỉ trả các thư mục giao diện. Không truy cập được `.env`, `server/`, `sql/` từ trình duyệt.

## Cấu trúc thư mục

```text
cinema-management-website/
├── admin/                  # Giao diện & logic Admin Dashboard
│   ├── css/admin.css       #   Style trang quản trị
│   ├── js/                 #   core.js (dùng chung) + logic CRUD từng trang, thống kê
│   ├── index.html          #   Tổng quan, thống kê doanh thu
│   ├── movies.html, showtimes.html, cinemas.html, halls.html, seats.html,
│   └── bookings.html, users.html, login.html
├── assets/images/          # Poster phim mẫu
├── css/                    # Design System chung (BEM)
│   ├── base.css            #   Biến màu, layout, nút
│   ├── auth.css            #   Module đăng ký / đăng nhập
│   ├── booking.css         #   Sơ đồ phòng chiếu, thanh toán, vé
│   └── style.css           #   Trang chủ, danh sách, chi tiết phim
├── js/
│   ├── auth.js             #   Đăng ký / đăng nhập / phiên làm việc
│   ├── search.js           #   Tìm kiếm phim realtime
│   ├── seats.js            #   Chọn ghế, tính tiền, thanh toán, vé điện tử
│   ├── data.js             #   Gọi API, chuyển đổi dữ liệu
│   └── script.js           #   Trang chủ, danh sách, chi tiết phim
├── server/                 # Backend Node.js (Express)
│   ├── server.js           #   Khởi tạo server
│   ├── config/             #   env.js (.env), db.js (kết nối MySQL)
│   ├── routes/             #   api.js (khách), admin.js (quản trị)
│   ├── controllers/        #   Xử lý nghiệp vụ (+ admin/)
│   ├── middleware/         #   Phân quyền, bảo mật, lưu phiên
│   ├── utils/              #   Tiện ích, upload ảnh
│   ├── test-db.js          #   Kiểm tra kết nối CSDL
│   ├── db-init.js          #   Tạo CSDL + dữ liệu mẫu
│   └── export-dummy-json.js
├── sql/
│   ├── schema.sql          #   Bảng, khóa ngoại, chỉ mục
│   ├── procedures.sql      #   sp_book_seat (chống trùng ghế)
│   ├── triggers.sql        #   Chặn trùng lịch chiếu cùng phòng
│   ├── expire_bookings*.sql#   Hủy giữ ghế quá hạn
│   ├── dummy-data.sql      #   Dữ liệu mẫu + tài khoản admin
│   ├── seed_seats.sql, seed_extra_seats.sql
│   └── dummy-data.json     #   Dữ liệu mẫu JSON cho frontend
├── docs/                   # Phân tích thiết kế, báo cáo, sơ đồ (Mermaid + PNG)
├── uploads/movies/         # Ảnh do admin upload
├── index.html              # Trang chủ
├── movies.html             # Danh sách phim & bộ lọc
├── movie-detail.html       # Chi tiết phim (trailer, lịch chiếu)
├── booking.html            # Sơ đồ phòng chiếu
├── checkout.html           # Thanh toán & mã giảm giá
├── e-ticket.html           # Vé điện tử / QR
├── auth.html               # Đăng nhập / Đăng ký
├── package.json
└── .env.example
```

## API chính
| Phương thức | Đường dẫn | Mô tả |
|---|---|---|
| GET | `/api/movies[?page=&limit=]`, `/api/movies/:id` | Danh sách / chi tiết phim |
| GET | `/api/cinemas`, `/api/shows[?movie_id=]` | Rạp, suất chiếu |
| GET | `/api/shows/:id/seats` | Sơ đồ ghế + ghế đã đặt |
| GET/POST | `/api/auth/me`, `/register`, `/login`, `/logout` | Tài khoản |
| GET/POST | `/api/bookings`, `/api/bookings/:id/pay` | Lịch sử vé, giữ ghế, thanh toán (cần đăng nhập) |
| GET/POST/PUT/DELETE | `/api/admin/...` | API quản trị (chỉ admin) |

Mô tả đầy đủ các API có trong `docs/PhanTichThietKe.md`.
