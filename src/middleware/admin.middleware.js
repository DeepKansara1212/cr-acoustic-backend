const ApiError = require('../utils/ApiError');

const adminOnly = (req, res, next) => {
  if (!req.user?.isAdmin) {
    return next(new ApiError(403, 'Access denied: admin privileges required'));
  }
  next();
};

module.exports = { adminOnly };
