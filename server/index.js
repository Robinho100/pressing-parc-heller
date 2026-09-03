const express    = require('express');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path       = require('path');
const http       = require('http');
const fs         = require('fs');
const { initDb } = require('./db');

const app  = express();
const PORT = process.env.PORT || 3000;

// ============================================================
//   SÉCURITÉ GLOBALE
// ============================================================

// Derrière le reverse-proxy de l'hébergeur (Render) : 1 seul hop de confiance.
// Indispensable pour que req.ip / req.secure / le rate-limiting par IP
// et le cookie `Secure` fonctionnent correctement.
app.set('trust proxy', 1);

// ============================================================
//   REDIRECTION 301 → DOMAINE CANONIQUE
// ============================================================
// Le Worker Cloudflare `pressing-proxy` sert le site sur pressingduparcheller.fr
// en relayant en interne vers pressing-parc-heller.alwaysdata.net avec le header
// marqueur `x-proxied`. Une requête qui atteint l'ancien hôte SANS ce marqueur
// vient donc d'un accès direct → on la redirige en 301 vers le domaine .fr.
// (La condition sur le marqueur évite la boucle infinie avec le Worker.)
if (process.env.NODE_ENV === 'production') {
  const CANONICAL_HOST = 'pressingduparcheller.fr';
  const LEGACY_HOSTS   = ['pressing-parc-heller.alwaysdata.net'];
  app.use((req, res, next) => {
    const host = (req.headers.host || '').toLowerCase().split(':')[0];
    if (LEGACY_HOSTS.includes(host) && !req.headers['x-proxied']) {
      return res.redirect(301, `https://${CANONICAL_HOST}${req.originalUrl}`);
    }
    next();
  });
}

// Helmet : en-têtes HTTP de sécurité (CSP, HSTS, X-Frame-Options, nosniff, etc.)
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc:              ["'self'"],
      scriptSrc:               ["'self'"],                 // aucun script inline : tout est externalisé
      scriptSrcAttr:           ["'none'"],                 // pas de gestionnaires onclick=... inline
      styleSrc:                ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc:                 ["'self'", 'https://fonts.gstatic.com'],
      imgSrc:                  ["'self'", 'data:'],
      connectSrc:              ["'self'"],
      frameSrc:                ["'self'", 'https://www.google.com'],  // carte Google Maps
      objectSrc:               ["'none'"],
      baseUri:                 ["'self'"],
      formAction:              ["'self'"],
      frameAncestors:          ["'self'"],                 // anti-clickjacking
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,   // laisse l'iframe Google Maps se charger
}));

// Body parsers
app.use(express.json({ limit: '10kb' }));        // Limite la taille du body
app.use(express.urlencoded({ extended: false, limit: '10kb' }));
app.use(cookieParser());

// Limiteur global sur l'API (garde-fou anti-abus ; les écritures sensibles
// ont en plus leur propre limiteur plus strict dans les routes).
app.use('/api', rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes. Réessayez dans une minute.' },
}));

// ============================================================
//   ROUTES API
// ============================================================
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/prices',   require('./routes/prices'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/contact',  require('./routes/contact'));
app.use('/api/reviews',  require('./routes/reviews'));

// ============================================================
//   FICHIERS STATIQUES
// ============================================================
// IMPORTANT : on ne sert QUE le dossier `public/`.
// Le code serveur, la base de données, .git, les fichiers de config
// et la documentation ne doivent jamais être accessibles via HTTP.
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

app.use(express.static(PUBLIC_DIR, {
  dotfiles: 'ignore',
  setHeaders: (res, filePath) => {
    // L'espace d'administration ne doit jamais être indexé.
    if (filePath.includes(`${path.sep}admin${path.sep}`)) {
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    }
  },
}));

// Fallback → 404.html (page introuvable)
app.use((req, res) => {
  res.status(404).sendFile(path.join(PUBLIC_DIR, '404.html'));
});

// ============================================================
//   DÉMARRAGE
// ============================================================
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 Pressing du Parc Heller démarré !`);
    console.log(`   Site public  → http://localhost:${PORT}`);
    console.log(`   Admin panel  → http://localhost:${PORT}/admin`);
    console.log(`   API          → http://localhost:${PORT}/api/prices\n`);
  });
}).catch(err => {
  console.error('❌ Erreur initialisation DB :', err);
  process.exit(1);
});

// ============================================================
//   SITE V2 (comparaison design) — serveur statique séparé
//   UNIQUEMENT en développement local (jamais en production)
// ============================================================
if (process.env.NODE_ENV !== 'production') {
  const V2_PORT = 3001;
  const V2_ROOT = path.join(__dirname, '..', '..', 'pressing-parc-heller-v2');
  const V2_TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' };

  const v2Server = http.createServer((req, res) => {
    const reqPath = req.url === '/' ? '/index.html' : req.url.split('?')[0];
    const filePath = path.join(V2_ROOT, reqPath);
    if (!filePath.startsWith(V2_ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }
    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(404); res.end('Not found'); return; }
      res.writeHead(200, { 'Content-Type': V2_TYPES[path.extname(filePath)] || 'application/octet-stream' });
      res.end(data);
    });
  });
  v2Server.on('error', (err) => console.warn('⚠️  Serveur v2 non démarré :', err.code));
  v2Server.listen(V2_PORT, () => console.log(`   Site v2      → http://localhost:${V2_PORT}\n`));
}
