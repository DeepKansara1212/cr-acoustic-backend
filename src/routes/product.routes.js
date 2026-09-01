const express = require('express');
const {
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
} = require('../controllers/product.controller');
const { protect } = require('../middleware/auth.middleware');
const { adminOnly } = require('../middleware/admin.middleware');
const validate = require('../middleware/validate.middleware');
const { createProductSchema, updateProductSchema } = require('../validations/product.validation');
const upload = require('../middleware/upload.middleware');

const router = express.Router();

router.get('/', getProducts);
router.get('/export', protect, adminOnly, exportProducts);
router.get('/slug/:slug', getProductBySlug);
router.get('/category/:categoryId', getProductsByCategory);
router.get('/related/:productId', getRelatedProducts);

router.post('/bulk-import', protect, adminOnly, upload.single('file'), bulkImportProducts);
router.post('/', protect, adminOnly, validate(createProductSchema), createProduct);

router.get('/:id', getProductById);
router.put('/:id', protect, adminOnly, validate(updateProductSchema), updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

module.exports = router;
