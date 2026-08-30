const { query, run, get } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = require('express').Router();

// -------- GET /api/settings — PUBLIC --------
router.get('/', async (req, res) => {
  try {
    const rows = await query('SELECT key, value FROM settings');
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    return res.json({ settings });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors de la récupération des paramètres.' });
  }
});

// -------- PUT /api/settings — ADMIN ONLY --------
router.put(
  '/',
  authMiddleware,
  [
    body('contact_phone').trim().isLength({ min: 5, max: 25 }).withMessage('Téléphone invalide.').escape(),
    body('contact_address').trim().isLength({ min: 5, max: 200 }).withMessage('Adresse invalide.').escape(),
    body('hours_week').trim().isLength({ min: 1, max: 100 }).withMessage('Horaires semaine invalides.').escape(),
    body('hours_sat').trim().isLength({ min: 1, max: 100 }).withMessage('Horaires samedi invalides.').escape(),
    body('hours_thursday').trim().isLength({ min: 1, max: 100 }).withMessage('Horaires jeudi invalides.').escape(),
    body('google_maps_iframe').trim().isURL({ protocols: ['https'], require_protocol: true }).withMessage("URL Google Maps invalide.")
      .custom(val => {
        if (!val.startsWith('https://www.google.com/maps/embed') && !val.startsWith('https://maps.google.com')) {
          throw new Error("L'URL doit provenir de Google Maps (embed).");
        }
        return true;
      }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const { contact_phone, contact_address, hours_week, hours_thursday, hours_sat, google_maps_iframe } = req.body;

    try {
      await run('UPDATE settings SET value = ? WHERE key = "contact_phone"', [contact_phone]);
      await run('UPDATE settings SET value = ? WHERE key = "contact_address"', [contact_address]);
      await run('UPDATE settings SET value = ? WHERE key = "hours_week"', [hours_week]);
      await run('UPDATE settings SET value = ? WHERE key = "hours_thursday"', [hours_thursday]);
      await run('UPDATE settings SET value = ? WHERE key = "hours_sat"', [hours_sat]);
      await run('UPDATE settings SET value = ? WHERE key = "google_maps_iframe"', [google_maps_iframe]);

      return res.json({ success: true, message: 'Paramètres mis à jour.' });
    } catch (err) {
      return res.status(500).json({ error: 'Erreur lors de la mise à jour des paramètres.' });
    }
  }
);

// -------- GET /api/settings/backup — ADMIN ONLY --------
// Note: backup non disponible avec Turso (base cloud), endpoint conservé pour compatibilité
router.get('/backup', authMiddleware, (req, res) => {
  return res.status(410).json({ error: 'La sauvegarde locale n\'est plus disponible en mode cloud. Utilisez le dashboard Turso pour exporter vos données.' });
});

module.exports = router;
