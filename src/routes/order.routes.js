const express = require('express');
const {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  getAllOrders,
} = require('../controllers/order.controller');
const { protect } = require('../middleware/auth.middleware');
const { adminOnly } = require('../middleware/admin.middleware');
const validate = require('../middleware/validate.middleware');
const { createOrderSchema, updateOrderStatusSchema } = require('../validations/order.validation');

const router = express.Router();

router.use(protect);

router.post('/', validate(createOrderSchema), createOrder);
router.get('/', getUserOrders);
router.get('/admin/all', adminOnly, getAllOrders);
router.get('/:id', getOrderById);
router.put('/:id/status', adminOnly, validate(updateOrderStatusSchema), updateOrderStatus);

module.exports = router;
