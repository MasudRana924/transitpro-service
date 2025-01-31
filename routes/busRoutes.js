const express = require('express');
const { searchBuses, getBusSeats, bookSeats } = require('../controllers/busController');

const router = express.Router();

router.get('/search', searchBuses);
router.get('/:id/seats', getBusSeats);
router.post('/book', bookSeats);

module.exports = router;
