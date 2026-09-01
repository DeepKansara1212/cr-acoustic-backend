const express = require('express');
const { getProductReviews, addReview, updateReview, deleteReview } = require('../controllers/review.controller');
const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { createReviewSchema, updateReviewSchema } = require('../validations/review.validation');

const router = express.Router();

router.get('/:productId', getProductReviews);
router.post('/:productId', protect, validate(createReviewSchema), addReview);
router.put('/:id', protect, validate(updateReviewSchema), updateReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
