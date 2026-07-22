const db = require('./db');
const { sanitizeUser } = require('./auth');

function getToken(req) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return req.headers['x-auth-token'];
}

function authMiddleware(req, res, next) {
  const token = getToken(req);
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  const session = db.getSession(token);
  if (!session) return res.status(401).json({ error: 'Invalid or expired session' });

  req.user = sanitizeUser(session.user);
  req.token = token;
  next();
}

function optionalAuth(req, _res, next) {
  const token = getToken(req);
  if (token) {
    const session = db.getSession(token);
    if (session) {
      req.user = sanitizeUser(session.user);
      req.token = token;
    }
  }
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  };
}

module.exports = { authMiddleware, optionalAuth, requireRole };
