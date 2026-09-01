const express = require('express');
const passport = require('passport');
const {
  register,
  login,
  googleCallback,
  logout,
  getMe,
  refreshTokenHandler,
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { authLimiter } = require('../middleware/rateLimiter.middleware');
const { registerSchema, loginSchema } = require('../validations/auth.validation');

const router = express.Router();

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  googleCallback
);

router.post('/logout', logout);
router.get('/me', protect, getMe);
router.post('/refresh-token', refreshTokenHandler);

module.exports = router;
