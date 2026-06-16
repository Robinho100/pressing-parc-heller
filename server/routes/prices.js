const { query, run, get } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { body, param, validationResult } = require('express-validator');

const router = require('express').Router();

// -------- GET /api/prices — PUBLIC --------
// Retourne tous les services visibles avec leurs prix
router.get('/', (req, res) => {
  const services = query('SELECT slug, nom, description, prix, emoji FROM services WHERE visible = 1 ORDER BY id ASC');
  return res.json({ services });
});

// -------- GET /api/prices/all — ADMIN ONLY --------
// Retourne tous les services (y compris cachés) pour le dashboard
router.get('/all', authMiddleware, (req, res) => {
  const services = query('SELECT * FROM services ORDER BY id ASC');
  return res.json({ services });
});

// -------- PUT /api/prices/:slug — ADMIN ONLY --------
// Met à jour le prix d'un service
router.put(
  '/:slug',
  authMiddleware,
  [
    param('slug')
      .trim()
      .isAlphanumeric('fr-FR', { ignore: '-' }).withMessage('Slug invalide.'),
    body('prix')
      .trim()
      .isLength({ min: 1, max: 100 }).withMessage('Prix invalide (1-100 caractères).')
      .escape(), // Échappe les caractères HTML — protection XSS
    body('nom')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 }).withMessage('Nom invalide.')
      .escape(),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 300 }).withMessage('Description trop longue (max 300 caractères).')
      .escape(),
    body('visible')
      .optional()
      .isBoolean().withMessage('Visible doit être un booléen.'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { slug } = req.params;
    const { prix, nom, description, visible } = req.body;

    // Vérifier que le service existe (requête préparée)
    const service = get('SELECT id FROM services WHERE slug = ?', [slug]);
    if (!service) {
      return res.status(404).json({ error: 'Service introuvable.' });
    }

    // Mise à jour partielle — uniquement les champs envoyés
    if (prix !== undefined)        run('UPDATE services SET prix = ?, updated_at = CURRENT_TIMESTAMP WHERE slug = ?', [prix, slug]);
    if (nom !== undefined)         run('UPDATE services SET nom = ?, updated_at = CURRENT_TIMESTAMP WHERE slug = ?', [nom, slug]);
    if (description !== undefined) run('UPDATE services SET description = ?, updated_at = CURRENT_TIMESTAMP WHERE slug = ?', [description, slug]);
    if (visible !== undefined)     run('UPDATE services SET visible = ?, updated_at = CURRENT_TIMESTAMP WHERE slug = ?', [visible ? 1 : 0, slug]);

    const updated = get('SELECT * FROM services WHERE slug = ?', [slug]);
    return res.json({ success: true, service: updated });
  }
);

function slugify(text) {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

// -------- POST /api/prices — ADMIN ONLY --------
// Crée un nouveau service
router.post(
  '/',
  authMiddleware,
  [
    body('nom')
      .trim()
      .isLength({ min: 1, max: 100 }).withMessage('Le nom est requis (max 100 caractères).')
      .escape(),
    body('prix')
      .trim()
      .isLength({ min: 1, max: 100 }).withMessage('Le prix est requis (max 100 caractères).')
      .escape(),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 300 }).withMessage('La description fait au max 300 caractères.')
      .escape(),
    body('emoji')
      .optional()
      .trim()
      .escape(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { nom, prix, description = '', emoji = '✦' } = req.body;

    try {
      let baseSlug = slugify(nom);
      if (!baseSlug) baseSlug = 'service';
      
      let slug = baseSlug;
      let counter = 1;

      // S'assurer que le slug est unique
      while (true) {
        const existing = get('SELECT id FROM services WHERE slug = ?', [slug]);
        if (!existing) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      run(
        'INSERT INTO services (slug, nom, description, prix, emoji) VALUES (?, ?, ?, ?, ?)',
        [slug, nom, description, prix, emoji]
      );

      const created = get('SELECT * FROM services WHERE slug = ?', [slug]);
      return res.status(201).json({ success: true, service: created });
    } catch (err) {
      return res.status(500).json({ error: 'Erreur lors de la création du service.' });
    }
  }
);

// -------- DELETE /api/prices/:slug — ADMIN ONLY --------
// Supprime définitivement un service
router.delete(
  '/:slug',
  authMiddleware,
  [
    param('slug')
      .trim()
      .isAlphanumeric('fr-FR', { ignore: '-' }).withMessage('Slug invalide.'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { slug } = req.params;

    try {
      const service = get('SELECT id FROM services WHERE slug = ?', [slug]);
      if (!service) {
        return res.status(404).json({ error: 'Service introuvable.' });
      }

      run('DELETE FROM services WHERE slug = ?', [slug]);
      return res.json({ success: true, message: 'Service supprimé définitivement.' });
    } catch (err) {
      return res.status(500).json({ error: 'Erreur lors de la suppression du service.' });
    }
  }
);

module.exports = router;
