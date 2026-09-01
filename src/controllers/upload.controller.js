const streamifier = require('stream');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const cloudinary = require('../config/cloudinary');

const streamUpload = (buffer) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'cr-acoustic/products' },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    streamifier.Readable.from(buffer).pipe(uploadStream);
  });

const uploadImages = asyncHandler(async (req, res) => {
  const files = req.files;
  if (!files || files.length === 0) {
    throw new ApiError(400, 'No image files provided');
  }

  const results = await Promise.all(files.map((file) => streamUpload(file.buffer)));

  const images = results.map((result) => ({
    url: result.secure_url,
    alt: '',
    isDefault: false,
  }));

  new ApiResponse(res, 201, images, 'Images uploaded successfully');
});

module.exports = { uploadImages };
