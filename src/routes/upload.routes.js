const express = require('express');
const { uploadImages } = require('../controllers/upload.controller');
const { protect } = require('../middleware/auth.middleware');
const { adminOnly } = require('../middleware/admin.middleware');
const upload = require('../middleware/upload.middleware');

const router = express.Router();

router.post('/', protect, adminOnly, upload.array('images', 6), uploadImages);

module.exports = router;
