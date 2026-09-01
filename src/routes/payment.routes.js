const express = require('express');
const { createRazorpayOrder, verifyPayment } = require('../controllers/payment.controller');
const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { verifyPaymentSchema } = require('../validations/payment.validation');

const router = express.Router();

router.use(protect);

router.post('/razorpay-order', createRazorpayOrder);
router.post('/verify-payment', validate(verifyPaymentSchema), verifyPayment);

module.exports = router;
