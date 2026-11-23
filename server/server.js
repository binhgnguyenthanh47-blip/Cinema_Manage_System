const express = require('express');
const path = require('path');

const movieRoutes = require('./routes/movieRoutes');
const showRoutes = require('./routes/showRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const cinemaRoutes = require('./routes/cinemaRoutes');
const authRoutes = require('./routes/authRoutes'); // [1] Thêm route Auth (BUG-14)

const app = express();
const PORT = process.env.PORT || 3000;

const root = path.join(__dirname, '..');

app.use(express.json());

// API
app.use('/api/movies', movieRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/cinemas', cinemaRoutes);
app.use('/api/auth', authRoutes); // [1] Kích hoạt API /api/auth/login & /register

// API kiểm tra server
app.get('/api', (req, res) => {
    res.json({
        message: 'Cinema Management API is running'
    });
});

// Phục vụ CSS, JavaScript, hình ảnh và trang Admin
app.use('/css', express.static(path.join(root, 'css')));
app.use('/js', express.static(path.join(root, 'js')));
app.use('/assets', express.static(path.join(root, 'assets')));
app.use('/admin', express.static(path.join(root, 'admin'))); // [2] Phục vụ thư mục /admin (BUG-17)

// Điều hướng 2 file rỗng sang trang thật (BUG-16)
app.get('/movies.html', (req, res) => res.redirect('/danhsach.html'));
app.get('/movie_detail.html', (req, res) => res.redirect('/chitiet.html'));

// Trang chủ
app.get('/', (req, res) => {
    res.sendFile(path.join(root, 'index.html'));
});

// Các trang HTML chính thức
const pages = [
    'index.html',
    'auth.html', // [1] Thêm trang Đăng nhập / Đăng ký
    'booking.html',
    'checkout.html',
    'chitiet.html',
    'danhsach.html',
    'e_ticket.html'
];

pages.forEach(page => {
    app.get('/' + page, (req, res) => {
        res.sendFile(path.join(root, page));
    });
});

// [4] Middleware bắt lỗi JSON sai cú pháp & lỗi server (BUG-23)
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            success: false,
            message: 'Dữ liệu JSON gửi lên không hợp lệ!'
        });
    }
    console.error('Lỗi Server:', err);
    return res.status(500).json({
        success: false,
        message: 'Lỗi máy chủ nội bộ!'
    });
});

// Khởi động server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});