const ApiError = require('../utils/ApiError');
const { isValidEmail, isValidPassword, isNonEmptyString } = require('../utils/validators');
const { hashPassword, comparePassword } = require('../utils/password');
const { signToken } = require('../utils/jwt');
const userModel = require('../models/user.model');

async function register({ name, email, password }) {
  if (!isNonEmptyString(name, 150)) {
    throw new ApiError(400, 'Name is required and must be 150 characters or fewer.');
  }
  if (!isValidEmail(email)) {
    throw new ApiError(400, 'A valid email address is required.');
  }
  if (!isValidPassword(password)) {
    throw new ApiError(400, 'Password must be at least 8 characters long.');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await userModel.findByEmail(normalizedEmail);
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists.');
  }

  const passwordHash = await hashPassword(password);
  const user = await userModel.createUser({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
  });

  const token = signToken({ id: user.id });
  return { user, token };
}

async function login({ email, password }) {
  if (!isValidEmail(email) || typeof password !== 'string' || password.length === 0) {
    throw new ApiError(400, 'Email and password are required.');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const userRow = await userModel.findByEmail(normalizedEmail);

  // Same error for "no such user" and "wrong password" so we don't
  // reveal which part was incorrect.
  const invalidCredentialsError = new ApiError(401, 'Invalid email or password.');

  if (!userRow || !userRow.is_active) {
    throw invalidCredentialsError;
  }

  const passwordMatches = await comparePassword(password, userRow.password_hash);
  if (!passwordMatches) {
    throw invalidCredentialsError;
  }

  const token = signToken({ id: userRow.id });
  const { password_hash: _omit, ...safeUser } = userRow;
  return { user: safeUser, token };
}

module.exports = { register, login };
