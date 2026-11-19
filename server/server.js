
const express = require('express');
const path = require('path');

const movieRoutes = require('./routes/movieRoutes');
const showRoutes = require('./routes/showRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const cinemaRoutes = require('./routes/cinemaRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

const root = path.join(__dirname, '..');

app.use(express.json());

// API
app.use('/api/movies', movieRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/cinemas', cinemaRoutes);

// API kiểm tra server
app.get('/api', (req, res) => {
    res.json({
        message: 'Cinema Management API is running'
    });
});

// Phục vụ CSS, JavaScript và hình ảnh
app.use('/css', express.static(path.join(root, 'css')));
app.use('/js', express.static(path.join(root, 'js')));
app.use('/assets', express.static(path.join(root, 'assets')));

// Trang chủ
app.get('/', (req, res) => {
    res.sendFile(path.join(root, 'index.html'));
});

// Các trang HTML
const pages = [
    'index.html',
    'booking.html',
    'checkout.html',
    'chitiet.html',
    'danhsach.html',
    'e_ticket.html',
    'movies.html',
    'movie_detail.html'
];

pages.forEach(page => {
    app.get('/' + page, (req, res) => {
        res.sendFile(path.join(root, page));
    });
});

// Khởi động server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
