const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

const getDashboardStats = asyncHandler(async (req, res) => {
  const [totalOrders, totalUsers, totalProducts, lowStockProducts, revenueAgg, monthlyRevenue, topProducts, categoryBreakdown, recentOrders] =
    await Promise.all([
      Order.countDocuments(),
      User.countDocuments(),
      Product.countDocuments(),
      Product.find({ $expr: { $lte: ['$stock', '$lowStockThreshold'] } }).select('name stock lowStockThreshold'),
      Order.aggregate([
        { $match: { paymentStatus: 'completed' } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } },
      ]),
      Order.aggregate([
        { $match: { paymentStatus: 'completed' } },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            revenue: { $sum: '$totalAmount' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 },
      ]),
      Order.aggregate([
        { $match: { paymentStatus: 'completed' } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.productId',
            productName: { $first: '$items.productName' },
            unitsSold: { $sum: '$items.quantity' },
            revenue: { $sum: '$items.subtotal' },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
      ]),
      Product.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
        { $unwind: '$category' },
        { $project: { _id: 0, category: '$category.name', count: 1 } },
      ]),
      Order.find().sort({ createdAt: -1 }).limit(10).populate('userId', 'firstName lastName email'),
    ]);

  new ApiResponse(res, 200, {
    totalOrders,
    totalUsers,
    totalProducts,
    lowStockCount: lowStockProducts.length,
    lowStockProducts,
    totalRevenue: revenueAgg[0]?.totalRevenue || 0,
    monthlyRevenue,
    topProducts,
    categoryBreakdown,
    recentOrders,
  });
});

module.exports = { getDashboardStats };
