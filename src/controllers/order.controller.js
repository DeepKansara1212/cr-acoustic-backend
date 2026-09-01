const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Order = require('../models/Order');
const CartItem = require('../models/CartItem');
const Product = require('../models/Product');

const TAX_RATE = 0.18;

const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress } = req.body;

  const cartItems = await CartItem.find({ userId: req.user._id }).populate('productId');
  if (cartItems.length === 0) throw new ApiError(400, 'Cart is empty');

  const items = [];
  for (const cartItem of cartItems) {
    const product = cartItem.productId;
    if (!product || !product.isActive) {
      throw new ApiError(400, `Product ${cartItem.productId?.name || ''} is no longer available`);
    }
    if (product.stock < cartItem.quantity) {
      throw new ApiError(400, `Insufficient stock for ${product.name}`);
    }
    items.push({
      productId: product._id,
      productName: product.name,
      price: product.price,
      quantity: cartItem.quantity,
      subtotal: product.price * cartItem.quantity,
    });
  }

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const taxAmount = Math.round(subtotal * TAX_RATE * 100) / 100;
  const totalAmount = subtotal + taxAmount;

  const order = await Order.create({
    userId: req.user._id,
    items,
    shippingAddress,
    totalAmount,
    taxAmount,
  });

  await Promise.all(
    items.map((item) => Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } }))
  );
  await CartItem.deleteMany({ userId: req.user._id });

  new ApiResponse(res, 201, order, 'Order created');
});

const getUserOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
  new ApiResponse(res, 200, orders);
});

const getOrderById = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };
  if (!req.user.isAdmin) filter.userId = req.user._id;

  const order = await Order.findOne(filter);
  if (!order) throw new ApiError(404, 'Order not found');
  new ApiResponse(res, 200, order);
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus } = req.body;

  const order = await Order.findByIdAndUpdate(req.params.id, { orderStatus }, { new: true, runValidators: true });
  if (!order) throw new ApiError(404, 'Order not found');

  new ApiResponse(res, 200, order, 'Order status updated');
});

const getAllOrders = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const filter = {};
  if (req.query.status) filter.orderStatus = req.query.status;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  new ApiResponse(res, 200, {
    orders,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

module.exports = { createOrder, getUserOrders, getOrderById, updateOrderStatus, getAllOrders };
