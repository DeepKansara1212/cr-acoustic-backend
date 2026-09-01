const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    reviewTitle: { type: String, required: true, trim: true },
    reviewText: { type: String, trim: true },
    isVerifiedPurchase: { type: Boolean, default: false },
    helpful: { type: Number, default: 0 },
  },
  { timestamps: true }
);

reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

async function recalculateProductRating(productId) {
  const Review = mongoose.model('Review');
  const Product = mongoose.model('Product');

  const [stats] = await Review.aggregate([
    { $match: { productId } },
    { $group: { _id: '$productId', averageRating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } },
  ]);

  await Product.findByIdAndUpdate(productId, {
    averageRating: stats ? Math.round(stats.averageRating * 10) / 10 : 0,
    reviewCount: stats ? stats.reviewCount : 0,
  });
}

reviewSchema.post('save', function postSave(doc) {
  recalculateProductRating(doc.productId);
});

reviewSchema.post('findOneAndDelete', function postDelete(doc) {
  if (doc) recalculateProductRating(doc.productId);
});

reviewSchema.post('findOneAndUpdate', function postUpdate(doc) {
  if (doc) recalculateProductRating(doc.productId);
});

module.exports = mongoose.model('Review', reviewSchema);
