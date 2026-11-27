const express = require('express');
const router = express.Router();
const { sseHandler } = require('../utils/realtime');
const adminController = require('../controllers/adminController');

// Kênh đồng bộ thời gian thật (Server-Sent Events)
router.get('/stream', adminController.verifyAdmin, sseHandler);

// Áp dụng kiểm tra quyền Admin cho toàn bộ API bên dưới
router.use(adminController.verifyAdmin);

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);

// CRUD Phim
router.get('/movies', adminController.getAdminMovies);
router.post('/movies', adminController.createMovie);
router.put('/movies/:id', adminController.updateMovie);
router.delete('/movies/:id', adminController.deleteMovie);

// CRUD Suất chiếu
router.get('/shows', adminController.getAdminShows);
router.post('/shows', adminController.createShow);
router.put('/shows/:id', adminController.updateShow);
router.delete('/shows/:id', adminController.deleteShow);

// Rạp, Phòng & Ghế
router.get('/cinemas-halls', adminController.getCinemasAndHalls);
router.post('/cinemas', adminController.createCinema);
router.post('/halls', adminController.createHall);
router.get('/halls/:hallId/seats', adminController.getHallSeats);
router.post('/halls/:hallId/seats/generate', adminController.generateHallSeats);
router.put('/seats/:seatId', adminController.updateSeatType);

// Quản lý Đơn đặt vé
router.get('/bookings', adminController.getAdminBookings);
router.put('/bookings/:id/status', adminController.updateBookingStatus);

module.exports = router;