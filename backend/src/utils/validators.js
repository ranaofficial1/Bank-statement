const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(value) {
  return typeof value === 'string' && EMAIL_REGEX.test(value.trim());
}

function isValidPassword(value) {
  return typeof value === 'string' && value.length >= 8;
}

function isNonEmptyString(value, maxLength = 255) {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    value.trim().length <= maxLength
  );
}

module.exports = { isValidEmail, isValidPassword, isNonEmptyString };
