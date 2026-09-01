const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const User = require('../models/User');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

const issueTokens = (res, userId) => {
  const accessToken = generateAccessToken(userId);
  const refreshToken = generateRefreshToken(userId);
  res.cookie('refreshToken', refreshToken, refreshCookieOptions);
  return accessToken;
};

const register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, phone } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const user = await User.create({ firstName, lastName, email, password, phone });
  const accessToken = issueTokens(res, user._id);

  new ApiResponse(res, 201, { user: user.toSafeObject(), accessToken }, 'Registered successfully');
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'This account has been deactivated');
  }

  const accessToken = issueTokens(res, user._id);
  new ApiResponse(res, 200, { user: user.toSafeObject(), accessToken }, 'Logged in successfully');
});

const googleCallback = asyncHandler(async (req, res) => {
  const accessToken = issueTokens(res, req.user._id);
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  res.redirect(`${clientUrl}/auth/callback?token=${accessToken}`);
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie('refreshToken', refreshCookieOptions);
  new ApiResponse(res, 200, null, 'Logged out successfully');
});

const getMe = asyncHandler(async (req, res) => {
  new ApiResponse(res, 200, req.user.toSafeObject());
});

const refreshTokenHandler = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    throw new ApiError(401, 'No refresh token provided');
  }

  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) {
    throw new ApiError(401, 'Invalid refresh token');
  }

  const accessToken = issueTokens(res, user._id);
  new ApiResponse(res, 200, { accessToken }, 'Token refreshed');
});

module.exports = { register, login, googleCallback, logout, getMe, refreshTokenHandler };
