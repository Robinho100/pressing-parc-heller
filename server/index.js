const express    = require('express');
const helmet     = require('helmet');
const cookieParser = require('cookie-parser');
const path       = require('path');
const { initDb } = require('./db');

const app  = express();
const PORT = process.env.PORT || 3000;

// ============================================================
//   SÉCURITÉ GLOBALE
// ============================================================

// Helmet : headers HTTP de sécurité (X-Frame-Options, CSP, HSTS, etc.)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'", "'unsafe-inline'"],  // nécessaire pour les scripts inline
      styleSrc:    ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc:     ["'self'", 'https://fonts.gstatic.com'],
      imgSrc:      ["'self'", 'data:', 'https:'],
      connectSrc:  ["'self'"],
      frameSrc:    ["'self'", 'https://www.google.com'],  // Google Maps
    },
  },
}));

// Body parsers
app.use(express.json({ limit: '10kb' }));        // Limite la taille du body
app.use(express.urlencoded({ extended: false, limit: '10kb' }));
app.use(cookieParser());

// ============================================================
//   ROUTES API
// ============================================================
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/prices',   require('./routes/prices'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/contact',  require('./routes/contact'));

// ============================================================
//   FICHIERS STATIQUES
// ============================================================

// Admin panel (protégé côté client + middleware JWT)
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));

// Site public (index.html, style.css, etc.)
app.use(express.static(path.join(__dirname, '..')));

// Fallback → 404.html (page introuvable)
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '..', '404.html'));
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
