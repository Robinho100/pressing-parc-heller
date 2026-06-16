const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { get, run } = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

const router = require('express').Router();

// -------- RATE LIMITING : 5 tentatives / 15 min par IP --------
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Trop de tentatives. Réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// -------- POST /api/auth/login --------
router.post(
  '/login',
  loginLimiter,
  [
    body('email')
      .isEmail().withMessage('Email invalide.')
      .normalizeEmail()
      .trim(),
    body('password')
      .isLength({ min: 6 }).withMessage('Mot de passe trop court.')
      .trim(),
  ],
  async (req, res) => {
    // Validation des entrées
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    // Récupérer l'admin depuis la DB (requête préparée — pas d'injection SQL possible)
    const admin = get('SELECT * FROM admin WHERE email = ?', [email]);

    if (!admin) {
      // Délai fixe pour éviter le timing attack
      await new Promise(r => setTimeout(r, 500));
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }

    // Générer le JWT
    const token = jwt.sign(
      { id: admin.id, email: admin.email },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Cookie httpOnly (inaccessible au JS — protection XSS)
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000, // 8h
      // secure: true, // À activer quand HTTPS est configuré
    });

    return res.json({ success: true, message: 'Connecté avec succès.' });
  }
);

// -------- POST /api/auth/logout --------
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  return res.json({ success: true });
});

// -------- GET /api/auth/me --------
router.get('/me', require('../middleware/auth').authMiddleware, (req, res) => {
  return res.json({ email: req.admin.email });
});

// -------- POST /api/auth/update-profile --------
router.post(
  '/update-profile',
  require('../middleware/auth').authMiddleware,
  [
    body('email')
      .isEmail().withMessage('Email invalide.')
      .normalizeEmail()
      .trim(),
    body('currentPassword').trim().notEmpty().withMessage('Mot de passe actuel requis.'),
    body('newPassword')
      .optional({ checkFalsy: true })
      .isLength({ min: 8 }).withMessage('Le nouveau mot de passe doit faire au moins 8 caractères.')
      .matches(/[A-Z]/).withMessage('Doit contenir au moins une majuscule.')
      .matches(/[0-9]/).withMessage('Doit contenir au moins un chiffre.')
      .trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { email, currentPassword, newPassword } = req.body;
    const admin = get('SELECT * FROM admin WHERE id = ?', [req.admin.id]);

    if (!admin) {
      return res.status(404).json({ error: 'Administrateur introuvable.' });
    }

    // Vérifier le mot de passe actuel
    const valid = await bcrypt.compare(currentPassword, admin.password);
    if (!valid) {
      return res.status(401).json({ error: 'Mot de passe actuel incorrect.' });
    }

    // Si l'email change, vérifier l'unicité
    if (email !== admin.email) {
      const existing = get('SELECT id FROM admin WHERE email = ? AND id != ?', [email, req.admin.id]);
      if (existing) {
        return res.status(400).json({ error: 'Cette adresse email est déjà utilisée.' });
      }
    }

    // Effectuer les mises à jour
    let newHash = admin.password;
    if (newPassword) {
      newHash = await bcrypt.hash(newPassword, 12);
      run('UPDATE admin SET password = ? WHERE id = ?', [newHash, req.admin.id]);
    }

    run('UPDATE admin SET email = ? WHERE id = ?', [email, req.admin.id]);

    // Générer et renvoyer un nouveau JWT cookie car l'email ou les infos ont pu changer
    const token = jwt.sign(
      { id: admin.id, email: email },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000,
    });

    return res.json({ success: true, message: 'Profil mis à jour avec succès.', email });
  }
);

module.exports = router;
