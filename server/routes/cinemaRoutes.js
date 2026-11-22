
const express = require('express');
const router = express.Router();

const { getAllCinemas } = require('../controllers/cinemaController');

router.get('/', getAllCinemas);

module.exports = router;
