const express = require('express');
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/category.controller');
const { protect } = require('../middleware/auth.middleware');
const { adminOnly } = require('../middleware/admin.middleware');
const validate = require('../middleware/validate.middleware');
const { createCategorySchema, updateCategorySchema } = require('../validations/category.validation');

const router = express.Router();

router.get('/', getCategories);
router.post('/', protect, adminOnly, validate(createCategorySchema), createCategory);
router.put('/:id', protect, adminOnly, validate(updateCategorySchema), updateCategory);
router.delete('/:id', protect, adminOnly, deleteCategory);

module.exports = router;
