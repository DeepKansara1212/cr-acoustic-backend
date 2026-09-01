const mongoose = require('mongoose');
const slugify = require('slugify');
const BRANDS = require('../constants/brands');

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    alt: { type: String, default: '' },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true, index: true },
    shortDescription: { type: String, trim: true },
    fullDescription: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    comparePrice: { type: Number, min: 0 },
    costPrice: { type: Number, min: 0 },
    stock: { type: Number, required: true, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5, min: 0 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    brand: { type: String, required: true, enum: BRANDS },
    tags: [{ type: String, trim: true }],
    badge: { type: String, trim: true },
    images: {
      type: [imageSchema],
      validate: [(val) => val.length <= 6, 'A product can have at most 6 images'],
    },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', shortDescription: 'text', fullDescription: 'text', tags: 'text' });
productSchema.index({ category: 1, brand: 1, price: 1 });

productSchema.virtual('isLowStock').get(function isLowStock() {
  return this.stock <= this.lowStockThreshold;
});

productSchema.pre('validate', async function generateSlug(next) {
  if (this.isModified('name') || !this.slug) {
    const base = slugify(this.name, { lower: true, strict: true });
    let slug = base;
    let counter = 1;
    const Product = this.constructor;
    // eslint-disable-next-line no-await-in-loop
    while (await Product.exists({ slug, _id: { $ne: this._id } })) {
      slug = `${base}-${counter}`;
      counter += 1;
    }
    this.slug = slug;
  }
  next();
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
