const { query, run, get } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { body, param, validationResult } = require('express-validator');

const router = require('express').Router();

// -------- GET /api/prices — PUBLIC --------
router.get('/', async (req, res) => {
  try {
    const services = await query('SELECT slug, nom, description, prix, emoji FROM services WHERE visible = 1 ORDER BY id ASC');
    return res.json({ services });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors de la récupération des services.' });
  }
});

// -------- GET /api/prices/all — ADMIN ONLY --------
router.get('/all', authMiddleware, async (req, res) => {
  try {
    const services = await query('SELECT * FROM services ORDER BY id ASC');
    return res.json({ services });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors de la récupération des services.' });
  }
});

// -------- PUT /api/prices/:slug — ADMIN ONLY --------
router.put(
  '/:slug',
  authMiddleware,
  [
    param('slug').trim().isAlphanumeric('fr-FR', { ignore: '-' }).withMessage('Slug invalide.'),
    body('prix').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Prix invalide.').escape(),
    body('nom').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Nom invalide.').escape(),
    // Pas de .escape() : le rendu se fait via textContent (aucun risque XSS) et
    // .escape() transformerait les apostrophes/accents en entités illisibles.
    body('description').optional().trim().isLength({ max: 300 }).withMessage('Description trop longue.'),
    body('visible').optional().isBoolean().withMessage('Visible doit être un booléen.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const { slug } = req.params;
    const { prix, nom, description, visible } = req.body;

    try {
      const service = await get('SELECT id FROM services WHERE slug = ?', [slug]);
      if (!service) return res.status(404).json({ error: 'Service introuvable.' });

      if (prix !== undefined)        await run('UPDATE services SET prix = ?, updated_at = CURRENT_TIMESTAMP WHERE slug = ?', [prix, slug]);
      if (nom !== undefined)         await run('UPDATE services SET nom = ?, updated_at = CURRENT_TIMESTAMP WHERE slug = ?', [nom, slug]);
      if (description !== undefined) await run('UPDATE services SET description = ?, updated_at = CURRENT_TIMESTAMP WHERE slug = ?', [description, slug]);
      if (visible !== undefined)     await run('UPDATE services SET visible = ?, updated_at = CURRENT_TIMESTAMP WHERE slug = ?', [visible ? 1 : 0, slug]);

      const updated = await get('SELECT * FROM services WHERE slug = ?', [slug]);
      return res.json({ success: true, service: updated });
    } catch (err) {
      return res.status(500).json({ error: 'Erreur lors de la mise à jour du service.' });
    }
  }
);

function slugify(text) {
  return text.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-').replace(/^-+/, '').replace(/-+$/, '');
}

// -------- POST /api/prices — ADMIN ONLY --------
router.post(
  '/',
  authMiddleware,
  [
    body('nom').trim().isLength({ min: 1, max: 100 }).withMessage('Le nom est requis.').escape(),
    body('prix').trim().isLength({ min: 1, max: 100 }).withMessage('Le prix est requis.').escape(),
    body('description').optional().trim().isLength({ max: 300 }).withMessage('Description trop longue.'),
    body('emoji').optional().trim().escape(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const { nom, prix, description = '', emoji = '•' } = req.body;

    try {
      let baseSlug = slugify(nom) || 'service';
      let slug = baseSlug;
      let counter = 1;
      while (true) {
        const existing = await get('SELECT id FROM services WHERE slug = ?', [slug]);
        if (!existing) break;
        slug = `${baseSlug}-${counter++}`;
      }

      await run('INSERT INTO services (slug, nom, description, prix, emoji) VALUES (?, ?, ?, ?, ?)', [slug, nom, description, prix, emoji]);
      const created = await get('SELECT * FROM services WHERE slug = ?', [slug]);
      return res.status(201).json({ success: true, service: created });
    } catch (err) {
      return res.status(500).json({ error: 'Erreur lors de la création du service.' });
    }
  }
);

// -------- DELETE /api/prices/:slug — ADMIN ONLY --------
router.delete(
  '/:slug',
  authMiddleware,
  [param('slug').trim().isAlphanumeric('fr-FR', { ignore: '-' }).withMessage('Slug invalide.')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const { slug } = req.params;
    try {
      const service = await get('SELECT id FROM services WHERE slug = ?', [slug]);
      if (!service) return res.status(404).json({ error: 'Service introuvable.' });

      await run('DELETE FROM services WHERE slug = ?', [slug]);
      return res.json({ success: true, message: 'Service supprimé définitivement.' });
    } catch (err) {
      return res.status(500).json({ error: 'Erreur lors de la suppression.' });
    }
  }
);

module.exports = router;
