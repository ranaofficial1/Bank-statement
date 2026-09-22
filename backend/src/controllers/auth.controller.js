const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');
const authService = require('../services/auth.service');
const userModel = require('../models/user.model');

function cookieOptions() {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? 'strict' : 'lax',
    maxAge: env.cookie.maxAgeMs,
  };
}

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const { user, token } = await authService.register({ name, email, password });

  res.cookie(env.cookie.name, token, cookieOptions());
  res.status(201).json({ success: true, user, token });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { user, token } = await authService.login({ email, password });

  res.cookie(env.cookie.name, token, cookieOptions());
  res.status(200).json({ success: true, user, token });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie(env.cookie.name, { ...cookieOptions(), maxAge: 0 });
  res.status(200).json({ success: true, message: 'Logged out.' });
});

const me = asyncHandler(async (req, res) => {
  const user = await userModel.findById(req.userId);
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }
  res.status(200).json({ success: true, user });
});

module.exports = { register, login, logout, me };
