const express = require('express');

const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/products', require('./product.routes'));
router.use('/categories', require('./category.routes'));
router.use('/cart', require('./cart.routes'));
router.use('/orders', require('./order.routes'));
router.use('/admin', require('./admin.routes'));
router.use('/payment', require('./payment.routes'));
router.use('/reviews', require('./review.routes'));
router.use('/wishlist', require('./wishlist.routes'));
router.use('/upload', require('./upload.routes'));

module.exports = router;
