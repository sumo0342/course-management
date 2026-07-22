const crypto = require('crypto');

const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEYLEN = 64;
const PBKDF2_DIGEST = 'sha256';

// Hashes a password with a random per-user salt (PBKDF2).
// Stored format: "<salt>:<hash>" so no separate column/migration is needed.
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto
    .pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST)
    .toString('hex');
  return `${salt}:${hash}`;
}

// Verifies a plaintext password against a stored "<salt>:<hash>" value.
// Uses a timing-safe comparison to avoid leaking info via response timing.
function verifyPassword(password, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, originalHash] = stored.split(':');
  const hash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST);
  const originalHashBuffer = Buffer.from(originalHash, 'hex');
  if (originalHashBuffer.length !== hash.length) return false;
  return crypto.timingSafeEqual(hash, originalHashBuffer);
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function sanitizeUser(user) {
  const { password, ...safe } = user;
  return safe;
}

module.exports = { hashPassword, verifyPassword, generateToken, sanitizeUser };
