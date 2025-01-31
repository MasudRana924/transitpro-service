// routes/paymentRoutes.js
const express = require('express');
const paymentController = require('../controllers/paymentController');
const router = express.Router();
// Create Payment Endpoint
router.post('/create-payment', paymentController.createPayment);
router.post('/execute-payment', paymentController.executePayment);
module.exports = router;