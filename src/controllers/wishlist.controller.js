const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');
const Product = require('../models/Product');

const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('wishlist');
  new ApiResponse(res, 200, user.wishlist);
});

const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found');

  await User.findByIdAndUpdate(req.user._id, { $addToSet: { wishlist: productId } });
  new ApiResponse(res, 200, null, 'Added to wishlist');
});

const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  await User.findByIdAndUpdate(req.user._id, { $pull: { wishlist: productId } });
  new ApiResponse(res, 200, null, 'Removed from wishlist');
});

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
