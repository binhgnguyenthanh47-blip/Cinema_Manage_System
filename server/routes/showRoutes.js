
const express = require('express');
const router = express.Router();

const { getAllShows } = require('../controllers/showController');
const { getSeatsByShow } = require('../controllers/seatController');
const { seatSseHandler } = require('../utils/realtime');

// Lấy danh sách suất chiếu
router.get('/', getAllShows);

// Kết nối realtime cho khách hàng
router.get('/stream', seatSseHandler);

// Lấy danh sách ghế theo suất chiếu
router.get('/:showId/seats', getSeatsByShow);

module.exports = router;
