const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Review = require('../models/Review');
const Order = require('../models/Order');

const getProductReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ productId: req.params.productId })
    .populate('userId', 'firstName lastName')
    .sort({ createdAt: -1 });
  new ApiResponse(res, 200, reviews);
});

const addReview = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { rating, reviewTitle, reviewText } = req.body;

  const existing = await Review.findOne({ productId, userId: req.user._id });
  if (existing) throw new ApiError(409, 'You have already reviewed this product');

  const isVerifiedPurchase = await Order.exists({
    userId: req.user._id,
    'items.productId': productId,
    orderStatus: { $in: ['delivered', 'shipped', 'confirmed', 'processing'] },
  });

  const review = await Review.create({
    productId,
    userId: req.user._id,
    rating,
    reviewTitle,
    reviewText,
    isVerifiedPurchase: Boolean(isVerifiedPurchase),
  });

  new ApiResponse(res, 201, review, 'Review added');
});

const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findOne({ _id: req.params.id, userId: req.user._id });
  if (!review) throw new ApiError(404, 'Review not found');

  Object.assign(review, req.body);
  await review.save();

  new ApiResponse(res, 200, review, 'Review updated');
});

const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!review) throw new ApiError(404, 'Review not found');
  new ApiResponse(res, 200, null, 'Review deleted');
});

module.exports = { getProductReviews, addReview, updateReview, deleteReview };
