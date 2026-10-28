
### Cấu trúc Thư mục (Directory Structure)

```text
cinema-management-website/
├── admin/                  # Giao diện và logic dành riêng cho Admin Dashboard[cite: 2, 3]
│   ├── css/                # Style cục bộ cho trang quản trị[cite: 2]
│   ├── js/                 # Logic xử lý CRUD Phim, Lịch chiếu, Thống kê[cite: 3]
│   └── index.html          # Trang tổng quan thống kê doanh thu[cite: 3]
├── assets/                 # Thư mục tài nguyên tĩnh[cite: 2]
│   ├── images/             # Poster phim, banner, logo
│   └── fonts/              # Font chữ đồng nhất
├── css/                    # Chứa Design System chung theo quy tắc BEM[cite: 2]
│   ├── base.css            # Biến màu sắc, layout, button style[cite: 2]
│   ├── auth.css            # Style cho module Đăng ký/Đăng nhập[cite: 2]
│   └── booking.css         # Lưới Sơ đồ phòng chiếu (Grid/Flexbox)[cite: 3]
├── js/                     # Logic xử lý Frontend cho User Portal[cite: 2]
│   ├── auth.js             # Quản lý phiên làm việc (Session/LocalStorage)[cite: 2]
│   ├── search.js           # Thanh tìm kiếm phim thời gian thực[cite: 2]
│   └── seats.js            # Phân loại ghế, tính tổng tiền tự động[cite: 3]
├── server/                 # Cấu trúc xử lý JS/Backend API và kết nối CSDL[cite: 1]
│   ├── routes/             # Định tuyến các API endpoints
│   ├── controllers/        # Xử lý logic Backend
│   └── server.js           # File khởi tạo server Node.js
├── sql/                    # Quản trị cơ sở dữ liệu và truy vấn[cite: 2]
│   ├── schema.sql          # Tạo Tables, Foreign Keys, Indexes[cite: 3]
│   ├── procedures.sql      # Stored Procedures, Triggers kiểm tra trùng ghế[cite: 3]
│   ├── dummy-data.sql      # Dữ liệu giả (khởi tạo tài khoản quản trị mặc định là 'admin_cinema')[cite: 3, 4]
│   └── dummy-data.json     # File dữ liệu mẫu định dạng JSON để frontend test sớm UI[cite: 2, 4]
├── docs/                   # Quản lý tài liệu dự án[cite: 4]
│   ├── ERD_Diagram.png     # Sơ đồ CSDL ERD tổng thể[cite: 2, 4]
│   ├── Test_Cases.xlsx     # Bộ Test Cases cho quy trình kiểm thử cuốn chiếu[cite: 3, 4]
│   └── Project_Document.docx # Báo cáo, Hướng dẫn sử dụng[cite: 4]
├── .gitignore              # Chặn các thư mục tự sinh không cần đẩy lên Git (node_modules, .env)
├── package.json            # Quản lý cấu hình và thư viện dự án web
├── index.html              # Trang chủ (Homepage)[cite: 2]
├── movies.html             # Trang danh sách phim và bộ lọc[cite: 2]
├── movie-detail.html       # Trang chi tiết phim (Trailer, đánh giá)[cite: 2]
├── booking.html            # Giao diện sơ đồ phòng chiếu[cite: 3]
├── checkout.html           # Trang thanh toán và nhập mã Voucher[cite: 3]
└── e-ticket.html           # Giao diện hiển thị vé điện tử/QR Code[cite: 3]

```
