const express = require('express');
const router = express.Router();
const { createBooking, confirmCheckout } = require('../controllers/bookingController');

router.post('/', createBooking);
router.put('/:id/checkout', confirmCheckout);

module.exports = router;
