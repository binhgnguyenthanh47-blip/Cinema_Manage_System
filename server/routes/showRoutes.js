
const express = require('express');
const router = express.Router();

const { getAllShows } = require('../controllers/showController');
const { getSeatsByShow } = require('../controllers/seatController');

router.get('/', getAllShows);
router.get('/:showId/seats', getSeatsByShow);

module.exports = router;
