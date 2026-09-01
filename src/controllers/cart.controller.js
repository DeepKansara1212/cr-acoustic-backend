const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const CartItem = require('../models/CartItem');
const Product = require('../models/Product');

const getCart = asyncHandler(async (req, res) => {
  const items = await CartItem.find({ userId: req.user._id }).populate('productId');
  new ApiResponse(res, 200, items);
});

const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;

  const product = await Product.findById(productId);
  if (!product || !product.isActive) throw new ApiError(404, 'Product not found');
  if (product.stock < quantity) throw new ApiError(400, 'Insufficient stock');

  let item = await CartItem.findOne({ userId: req.user._id, productId });
  if (item) {
    item.quantity += quantity;
    item.price = product.price;
    await item.save();
  } else {
    item = await CartItem.create({
      userId: req.user._id,
      productId,
      quantity,
      price: product.price,
    });
  }

  new ApiResponse(res, 200, item, 'Item added to cart');
});

const updateCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found');
  if (product.stock < quantity) throw new ApiError(400, 'Insufficient stock');

  const item = await CartItem.findOneAndUpdate(
    { userId: req.user._id, productId },
    { quantity },
    { new: true }
  );
  if (!item) throw new ApiError(404, 'Cart item not found');

  new ApiResponse(res, 200, item, 'Cart item updated');
});

const removeCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const item = await CartItem.findOneAndDelete({ userId: req.user._id, productId });
  if (!item) throw new ApiError(404, 'Cart item not found');
  new ApiResponse(res, 200, null, 'Item removed from cart');
});

const clearCart = asyncHandler(async (req, res) => {
  await CartItem.deleteMany({ userId: req.user._id });
  new ApiResponse(res, 200, null, 'Cart cleared');
});

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, clearCart };
