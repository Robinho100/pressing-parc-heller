const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'pressing-heller-super-secret-key-2025-change-me';

function authMiddleware(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    // API → JSON, sinon redirect
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ error: 'Non authentifié. Veuillez vous connecter.' });
    }
    return res.redirect('/admin/');
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.admin = payload;
    next();
  } catch (err) {
    res.clearCookie('token');
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ error: 'Session expirée. Veuillez vous reconnecter.' });
    }
    return res.redirect('/admin/');
  }
}

module.exports = { authMiddleware, JWT_SECRET };
