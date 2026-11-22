
### Cấu trúc Thư mục (Directory Structure)

```text
cinema-management-website/
├── admin/                  # Giao diện và logic dành riêng cho Admin Dashboard
│   ├── css/                # Style cục bộ cho trang quản trị
│   ├── js/                 # Logic xử lý CRUD Phim, Lịch chiếu, Thống kê
│   └── index.html          # Trang tổng quan thống kê doanh thu
├── assets/                 # Thư mục tài nguyên tĩnh
│   ├── images/             # Poster phim, banner, logo
│   └── fonts/              # Font chữ đồng nhất
├── css/                    # Chứa Design System chung theo quy tắc BEM
│   ├── base.css            # Biến màu sắc, layout, button style
│   ├── auth.css            # Style cho module Đăng ký/Đăng nhập
│   └── booking.css         # Lưới Sơ đồ phòng chiếu (Grid/Flexbox)
├── js/                     # Logic xử lý Frontend cho User Portal
│   ├── auth.js             # Quản lý phiên làm việc (Session/LocalStorage)
│   ├── search.js           # Thanh tìm kiếm phim thời gian thực
│   └── seats.js            # Phân loại ghế, tính tổng tiền tự động
├── server/                 # Cấu trúc xử lý JS/Backend API và kết nối CSDL
│   ├── routes/             # Định tuyến các API endpoints
│   ├── controllers/        # Xử lý logic Backend
│   └── server.js           # File khởi tạo server Node.js
├── sql/                    # Quản trị cơ sở dữ liệu và truy vấn
│   ├── schema.sql          # Tạo Tables, Foreign Keys, Indexes
│   ├── procedures.sql      # Stored Procedures, Triggers kiểm tra trùng ghế
│   ├── dummy-data.sql      # Dữ liệu giả (khởi tạo tài khoản quản trị mặc định là 'admin_cinema')
│   └── dummy-data.json     # File dữ liệu mẫu định dạng JSON để frontend test sớm UI
├── docs/                   # Quản lý tài liệu dự án
│   ├── ERD_Diagram.png     # Sơ đồ CSDL ERD tổng thể
│   ├── Test_Cases.xlsx     # Bộ Test Cases cho quy trình kiểm thử cuốn chiếu
│   └── Project_Document.docx # Báo cáo, Hướng dẫn sử dụng
├── .gitignore              # Chặn các thư mục tự sinh không cần đẩy lên Git (node_modules, .env)
├── package.json            # Quản lý cấu hình và thư viện dự án web
├── index.html              # Trang chủ (Homepage)
├── movies.html             # Trang danh sách phim và bộ lọc
├── movie-detail.html       # Trang chi tiết phim (Trailer, đánh giá)
├── booking.html            # Giao diện sơ đồ phòng chiếu
├── checkout.html           # Trang thanh toán và nhập mã Voucher
└── e-ticket.html           # Giao diện hiển thị vé điện tử/QR Code
├── movie-detail.html       # Trang chi tiết phim (Trailer, đánh giá)[cite: 2]
├── booking.html            # Giao diện sơ đồ phòng chiếu[cite: 3]
├── checkout.html           # Trang thanh toán và nhập mã Voucher[cite: 3]
└── e-ticket.html           # Giao diện hiển thị vé điện tử/QR Code[cite: 3]

```
