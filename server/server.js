require('dotenv').config();
const express = require('express');
const path = require('path');

const movieRoutes = require('./routes/movieRoutes');
const showRoutes = require('./routes/showRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const cinemaRoutes = require('./routes/cinemaRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

const root = path.join(__dirname, '..');

app.use(express.json());

// API
app.use('/api/movies', movieRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/cinemas', cinemaRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

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
app.use('/admin', express.static(path.join(root, 'admin')));

// Điều hướng 2 file rỗng sang trang thật
app.get('/movies.html', (req, res) => res.redirect('/danhsach.html'));
app.get('/movie_detail.html', (req, res) => res.redirect('/chitiet.html'));

// Trang chủ
app.get('/', (req, res) => {
    res.sendFile(path.join(root, 'index.html'));
});

// Các trang HTML chính thức
const pages = [
    'index.html',
    'auth.html',
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

// Middleware bắt lỗi JSON sai cú pháp & lỗi server
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

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
