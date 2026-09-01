const { Readable } = require('stream');
const csv = require('csv-parser');
const { Parser: CsvParser } = require('json2csv');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Product = require('../models/Product');
const Category = require('../models/Category');

const SORT_MAP = {
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  newest: { createdAt: -1 },
  rating: { averageRating: -1 },
};

const buildFilter = (query) => {
  const filter = { isActive: true };

  if (query.category) filter.category = query.category;
  if (query.brand) filter.brand = query.brand;
  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
  }
  if (query.search) filter.$text = { $search: query.search };
  if (query.isFeatured) filter.isFeatured = query.isFeatured === 'true';

  return filter;
};

const getProducts = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const filter = buildFilter(req.query);
  const sort = SORT_MAP[req.query.sort] || { createdAt: -1 };

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  new ApiResponse(res, 200, {
    products,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category', 'name slug');
  if (!product) throw new ApiError(404, 'Product not found');
  new ApiResponse(res, 200, product);
});

const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug }).populate('category', 'name slug');
  if (!product) throw new ApiError(404, 'Product not found');
  new ApiResponse(res, 200, product);
});

const getProductsByCategory = asyncHandler(async (req, res) => {
  const products = await Product.find({ category: req.params.categoryId, isActive: true }).populate(
    'category',
    'name slug'
  );
  new ApiResponse(res, 200, products);
});

const getRelatedProducts = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId);
  if (!product) throw new ApiError(404, 'Product not found');

  const related = await Product.find({
    category: product.category,
    _id: { $ne: product._id },
    isActive: true,
  })
    .limit(8)
    .populate('category', 'name slug');

  new ApiResponse(res, 200, related);
});

const createProduct = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.body.category);
  if (!category) throw new ApiError(400, 'Invalid category');

  const product = await Product.create(req.body);
  new ApiResponse(res, 201, product, 'Product created');
});

const updateProduct = asyncHandler(async (req, res) => {
  if (req.body.category) {
    const category = await Category.findById(req.body.category);
    if (!category) throw new ApiError(400, 'Invalid category');
  }

  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!product) throw new ApiError(404, 'Product not found');
  new ApiResponse(res, 200, product, 'Product updated');
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');
  new ApiResponse(res, 200, null, 'Product deleted');
});

const parseCsvBuffer = (buffer) =>
  new Promise((resolve, reject) => {
    const rows = [];
    Readable.from(buffer)
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });

const bulkImportProducts = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'CSV file is required');

  const rows = await parseCsvBuffer(req.file.buffer);
  const categories = await Category.find();
  const categoryByName = new Map(categories.map((c) => [c.name.toLowerCase(), c._id]));

  const results = { created: 0, failed: [] };

  for (const row of rows) {
    try {
      const categoryId = categoryByName.get(String(row.category || '').toLowerCase());
      if (!categoryId) throw new Error(`Unknown category: ${row.category}`);

      // eslint-disable-next-line no-await-in-loop
      await Product.create({
        name: row.name,
        fullDescription: row.fullDescription,
        shortDescription: row.shortDescription,
        price: Number(row.price),
        comparePrice: row.comparePrice ? Number(row.comparePrice) : undefined,
        stock: Number(row.stock) || 0,
        category: categoryId,
        brand: row.brand,
        tags: row.tags ? row.tags.split('|').map((t) => t.trim()) : [],
        badge: row.badge,
      });
      results.created += 1;
    } catch (error) {
      results.failed.push({ row: row.name, reason: error.message });
    }
  }

  new ApiResponse(res, 200, results, 'Bulk import completed');
});

const exportProducts = asyncHandler(async (req, res) => {
  const products = await Product.find().populate('category', 'name').lean();

  const flattened = products.map((p) => ({
    name: p.name,
    slug: p.slug,
    price: p.price,
    comparePrice: p.comparePrice,
    stock: p.stock,
    category: p.category?.name,
    brand: p.brand,
    isActive: p.isActive,
    averageRating: p.averageRating,
    reviewCount: p.reviewCount,
  }));

  const parser = new CsvParser();
  const csvData = parser.parse(flattened);

  res.header('Content-Type', 'text/csv');
  res.attachment('products-export.csv');
  res.send(csvData);
});

module.exports = {
  getProducts,
  getProductById,
  getProductBySlug,
  getProductsByCategory,
  getRelatedProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkImportProducts,
  exportProducts,
};
