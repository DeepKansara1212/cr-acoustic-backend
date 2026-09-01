const express = require('express');
const { getCart, addToCart, updateCartItem, removeCartItem, clearCart } = require('../controllers/cart.controller');
const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { addToCartSchema, updateCartItemSchema } = require('../validations/cart.validation');

const router = express.Router();

router.use(protect);

router.get('/', getCart);
router.post('/add', validate(addToCartSchema), addToCart);
router.put('/update/:productId', validate(updateCartItemSchema), updateCartItem);
router.delete('/remove/:productId', removeCartItem);
router.delete('/clear', clearCart);

module.exports = router;
