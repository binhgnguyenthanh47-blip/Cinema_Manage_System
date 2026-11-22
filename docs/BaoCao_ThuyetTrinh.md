# KHUNG BÁO CÁO THUYẾT TRÌNH
## Website đặt vé xem phim — Cinema Manage System

> Yêu cầu của đề: **ngắn gọn, đủ ý, trực quan**; đầy đủ **phân tích thiết kế hệ thống, database**; **đánh giá mức độ tham gia** của từng thành viên.
> Thời lượng gợi ý: 12–15 phút trình bày + 5 phút demo + hỏi đáp.
> Các ô `[...]` là phần nhóm cần tự điền.

---

## Phần A — Dàn ý slide (15 slide)

| # | Slide | Nội dung chính | Hình minh họa |
|---|---|---|---|
| 1 | Bìa | Tên đề tài, môn học, GVHD `[...]`, nhóm `[...]`, danh sách thành viên | — |
| 2 | Đề tài & mục tiêu | Chủ đề **Website bán hàng cơ bản** — sản phẩm là vé xem phim. Bảng đối chiếu: sản phẩm ↔ phim/suất, giỏ hàng ↔ giữ ghế, đơn hàng ↔ đơn đặt vé (mục 1.2 tài liệu) | — |
| 3 | Công nghệ | PHP 8 + PDO, MySQL/MariaDB, HTML/CSS/JS, Quill editor, Chart.js, XAMPP | Logo các công nghệ |
| 4 | Đáp ứng yêu cầu đề | Bảng 8 yêu cầu kỹ thuật → cách đáp ứng (mục 1.3 tài liệu) | — |
| 5 | Use case | 3 tác nhân: khách vãng lai, khách hàng, quản trị viên | `diagrams/usecase.png` |
| 6 | Kiến trúc | Trang khách gọi JSON API; Admin render PHP; lớp `includes/` dùng chung; CSDL có procedure/trigger/event | `diagrams/kien-truc.png` |
| 7 | Database (ERD) | 10 bảng, quan hệ chính: phim–suất–vé, đơn–vé–thanh toán; ràng buộc FK, CHECK, UNIQUE | `diagrams/erd.png` |
| 8 | Điểm nhấn CSDL | **Chống đặt trùng ghế** bằng cột tự sinh `active_seat_id` + unique; trigger chặn trùng lịch; event nhả ghế hết hạn | Trích `sql/schema.sql`, `triggers.sql` |
| 9 | Luồng đặt vé | Chọn ghế → giữ 15 phút → thanh toán → vé QR; xử lý khi 2 người tranh cùng ghế | `diagrams/dat-ve.png` |
| 10 | Vòng đời đơn | pending → paid / expired / cancelled; ghế được mở lại thế nào | `diagrams/trang-thai-don.png` |
| 11 | Giao diện khách | Trang chủ, chi tiết phim, chọn ghế, thanh toán, vé điện tử (máy tính + điện thoại) | `screenshots/01` → `06` |
| 12 | Trang Admin | Tổng quan + biểu đồ; form phim có **editor + upload nhiều ảnh**; chi tiết đơn có bảng tính tiền; phân trang | `screenshots/07` → `11` |
| 13 | Responsive & bảo mật | Admin trên điện thoại (menu ☰, bảng dạng thẻ); bảng biện pháp bảo mật (mục 7 tài liệu) | `screenshots/12`, `13`, `14` |
| 14 | Kiểm thử | 36 ca trang khách + 55 ca Admin + kiểm tra giao diện 5 kích thước — đều đạt | Bảng mục 9 tài liệu |
| 15 | Phân công & đánh giá | Bảng Phần C bên dưới; kết luận, hướng phát triển | — |

### Hướng phát triển (slide 15)
- Tích hợp cổng thanh toán thật (VNPay / MoMo sandbox), gửi vé qua email.
- Quên mật khẩu, trang hồ sơ cá nhân, đổi mật khẩu.
- Quản lý combo và mã giảm giá trong Admin (hiện cấu hình trong `includes/config.php`).
- Báo cáo doanh thu theo phim / rạp / tháng, xuất Excel.

---

## Phần B — Kịch bản demo (5 phút)

Chuẩn bị trước: bật Apache + MySQL trong XAMPP; mở sẵn 2 cửa sổ trình duyệt (1 thường, 1 ẩn danh).

1. **Trang khách** (cửa sổ thường): trang chủ → tìm "toy" → chi tiết phim (trailer, bộ ảnh, lịch chiếu) → bấm giờ chiếu.
2. **Đăng nhập** `customer@cinema.local` / `123456` → chọn 2 ghế → "Tiếp tục" (đồng hồ giữ ghế 15:00).
3. **Chống trùng ghế** (cửa sổ ẩn danh): đăng ký tài khoản mới → mở cùng suất → 2 ghế vừa chọn đã **khóa**, không bấm được.
4. Quay lại cửa sổ thường: nhập mã `UTH2026`, thêm 1 combo → **Thanh toán** → vé điện tử QR, lịch sử vé.
5. **Admin** `admin@cinema.local` / `admin123`: Tổng quan (doanh thu tăng) → Đơn đặt vé → chi tiết đơn vừa mua (bảng tính tiền).
6. **CRUD + editor + upload**: Phim → Thêm phim → soạn nội dung bằng editor → chọn poster + nhiều ảnh → Lưu → mở trang khách xem bộ ảnh.
7. **Phân quyền**: ở cửa sổ ẩn danh (tài khoản khách) gõ `/admin/` → trang 403.
8. (Nếu còn thời gian) Mở DevTools chế độ điện thoại → trang Admin thu menu ☰, bảng thành dạng thẻ.

---

## Phần C — Phân công và đánh giá mức độ tham gia

### C.1. Phân công công việc
| STT | Họ tên | MSSV | Công việc phụ trách | Sản phẩm / file chính |
|---|---|---|---|---|
| 1 | `[...]` | `[...]` | `[vd: Thiết kế CSDL, procedure, trigger]` | `[vd: sql/*.sql, ERD]` |
| 2 | `[...]` | `[...]` | `[vd: Trang khách: trang chủ, danh sách, chi tiết]` | `[vd: index.html, js/script.js]` |
| 3 | `[...]` | `[...]` | `[vd: Đặt vé, thanh toán, vé điện tử]` | `[vd: booking/checkout/e_ticket, js/seats.js]` |
| 4 | `[...]` | `[...]` | `[vd: Backend API, đăng nhập, phân quyền]` | `[vd: api/, includes/]` |
| 5 | `[...]` | `[...]` | `[vd: Trang Admin: CRUD, upload, editor]` | `[vd: admin/]` |

### C.2. Đánh giá mức độ tham gia
Tiêu chí gợi ý (thang 10): **Khối lượng** công việc · **Chất lượng** (chạy đúng, ít lỗi) · **Đúng hạn** · **Phối hợp nhóm** (họp, hỗ trợ, review).

| STT | Họ tên | Khối lượng | Chất lượng | Đúng hạn | Phối hợp | Mức đóng góp (%) | Hoàn thành |
|---|---|---|---|---|---|---|---|
| 1 | `[...]` | `[ /10]` | `[ /10]` | `[ /10]` | `[ /10]` | `[ %]` | `[Tốt / Khá / Đạt]` |
| 2 | `[...]` | | | | | | |
| 3 | `[...]` | | | | | | |
| 4 | `[...]` | | | | | | |
| 5 | `[...]` | | | | | | |
| | **Tổng** | | | | | **100%** | |

> Nhóm nên thống nhất bảng này trong buổi họp cuối và có xác nhận của tất cả thành viên.

### C.3. Tiến độ (gợi ý)
| Tuần | Công việc | Người thực hiện | Trạng thái |
|---|---|---|---|
| `[...]` | Phân tích yêu cầu, thiết kế CSDL | `[...]` | `[...]` |
| `[...]` | Giao diện trang khách | `[...]` | `[...]` |
| `[...]` | Backend API, đăng nhập, đặt vé | `[...]` | `[...]` |
| `[...]` | Trang Admin, upload, editor | `[...]` | `[...]` |
| `[...]` | Kiểm thử, sửa lỗi, tài liệu, slide | `[...]` | `[...]` |

---

## Phần D — Danh sách kiểm tra trước khi nộp
- [ ] Chạy lại toàn bộ `sql/` trên máy sạch theo thứ tự trong README → web chạy được.
- [ ] Đổi mật khẩu tài khoản `admin@cinema.local`.
- [ ] Không nộp file `.env` có mật khẩu thật (chỉ nộp `.env.example`).
- [ ] Ảnh test trong `uploads/movies/` đã dọn (chỉ giữ `.gitkeep` nếu không cần).
- [ ] Điền đủ các ô `[...]` trong file này và tên nhóm / GVHD trên slide.
- [ ] Slide có đủ: phân tích thiết kế (use case, kiến trúc, luồng), database (ERD + mô tả bảng), đánh giá thành viên.
