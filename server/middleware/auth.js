const jwt = require('jsonwebtoken');

// La clé de signature JWT DOIT venir de l'environnement.
// En production, on refuse de démarrer sans elle (jamais de secret par défaut
// dans le code : le dépôt est public, un secret en dur = comptes falsifiables).
let JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'JWT_SECRET manquant : définissez la variable d\'environnement JWT_SECRET avant de démarrer en production.'
    );
  }
  // Développement local uniquement — non sécurisé, jamais utilisé en production.
  JWT_SECRET = 'dev-only-insecure-secret-ne-pas-utiliser-en-production';
  console.warn('⚠️  JWT_SECRET non défini : utilisation d\'une clé de développement non sécurisée.');
}

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
