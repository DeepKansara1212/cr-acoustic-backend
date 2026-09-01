const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Category = require('../models/Category');

const getCategories = asyncHandler(async (req, res) => {
  const filter = req.query.includeInactive === 'true' ? {} : { isActive: true };
  const categories = await Category.find(filter).sort({ name: 1 });
  new ApiResponse(res, 200, categories);
});

const createCategory = asyncHandler(async (req, res) => {
  const category = await Category.create(req.body);
  new ApiResponse(res, 201, category, 'Category created');
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!category) throw new ApiError(404, 'Category not found');
  new ApiResponse(res, 200, category, 'Category updated');
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');
  new ApiResponse(res, 200, null, 'Category deleted');
});

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
