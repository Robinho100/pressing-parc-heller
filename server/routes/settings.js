const { query, run, get } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = require('express').Router();

// -------- GET /api/settings — PUBLIC --------
// Retourne tous les paramètres sous forme d'objet clé-valeur
router.get('/', (req, res) => {
  try {
    const rows = query('SELECT key, value FROM settings');
    const settings = {};
    rows.forEach(r => {
      settings[r.key] = r.value;
    });
    return res.json({ settings });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors de la récupération des paramètres.' });
  }
});

// -------- PUT /api/settings — ADMIN ONLY --------
// Met à jour les coordonnées et horaires
router.put(
  '/',
  authMiddleware,
  [
    body('contact_email')
      .trim()
      .isEmail().withMessage('Adresse email de contact invalide.')
      .isLength({ max: 100 }).withMessage('Email trop long (max 100 caractères).')
      .normalizeEmail(),
    body('contact_phone')
      .trim()
      .isLength({ min: 5, max: 25 }).withMessage('Le téléphone doit faire entre 5 et 25 caractères.')
      .escape(),
    body('contact_address')
      .trim()
      .isLength({ min: 5, max: 200 }).withMessage('L\'adresse doit faire entre 5 et 200 caractères.')
      .escape(),
    body('hours_week')
      .trim()
      .isLength({ min: 1, max: 100 }).withMessage('Les horaires de semaine doivent faire entre 1 et 100 caractères.')
      .escape(),
    body('hours_sat')
      .trim()
      .isLength({ min: 1, max: 100 }).withMessage('Les horaires du samedi doivent faire entre 1 et 100 caractères.')
      .escape(),
    body('google_maps_iframe')
      .trim()
      .isURL({ protocols: ['https'], require_protocol: true }).withMessage('L\'URL Google Maps doit être valide.')
      .custom(val => {
        if (!val.startsWith('https://www.google.com/maps/embed') && !val.startsWith('https://maps.google.com')) {
          throw new Error('L\'URL doit provenir de Google Maps (embed).');
        }
        return true;
      }),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const {
      contact_email,
      contact_phone,
      contact_address,
      hours_week,
      hours_sat,
      google_maps_iframe
    } = req.body;

    try {
      run('UPDATE settings SET value = ? WHERE key = "contact_email"', [contact_email]);
      run('UPDATE settings SET value = ? WHERE key = "contact_phone"', [contact_phone]);
      run('UPDATE settings SET value = ? WHERE key = "contact_address"', [contact_address]);
      run('UPDATE settings SET value = ? WHERE key = "hours_week"', [hours_week]);
      run('UPDATE settings SET value = ? WHERE key = "hours_sat"', [hours_sat]);
      run('UPDATE settings SET value = ? WHERE key = "google_maps_iframe"', [google_maps_iframe]);

      return res.json({ success: true, message: 'Paramètres mis à jour.' });
    } catch (err) {
      return res.status(500).json({ error: 'Erreur lors de la mise à jour des paramètres.' });
    }
  }
);

module.exports = router;
