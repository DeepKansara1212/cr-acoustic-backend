const { z } = require('zod');

const verifyPaymentSchema = z.object({
  body: z.object({
    razorpay_order_id: z.string().min(1),
    razorpay_payment_id: z.string().min(1),
    razorpay_signature: z.string().min(1),
    orderId: z.string().min(1, 'Internal orderId is required'),
  }),
});

module.exports = { verifyPaymentSchema };
