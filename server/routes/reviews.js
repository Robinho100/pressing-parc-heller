const { query, run, get, db } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { body, param, validationResult } = require('express-validator');

const router = require('express').Router();

const SOURCES = ['Google', 'Pages Jaunes', 'Autre'];

// -------- GET /api/reviews — PUBLIC --------
// Renvoie uniquement les avis visibles, dans l'ordre défini par `position`.
router.get('/', async (req, res) => {
  try {
    const reviews = await query(
      'SELECT id, auteur, localite, texte, note, source FROM reviews WHERE visible = 1 ORDER BY position ASC, id ASC'
    );
    return res.json({ reviews });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors de la récupération des avis.' });
  }
});

// -------- GET /api/reviews/all — ADMIN ONLY --------
router.get('/all', authMiddleware, async (req, res) => {
  try {
    const reviews = await query('SELECT * FROM reviews ORDER BY position ASC, id ASC');
    return res.json({ reviews });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors de la récupération des avis.' });
  }
});

// Validateurs communs : tous les champs sont facultatifs (utilisés tels quels
// pour le PUT, qui accepte des mises à jour partielles comme /api/prices).
const reviewValidators = [
  body('auteur').optional().trim().isLength({ min: 1, max: 80 }).withMessage('Le nom est requis (80 caractères max).'),
  body('localite').optional({ nullable: true }).trim().isLength({ max: 80 }).withMessage('Localité trop longue.'),
  body('texte').optional().trim().isLength({ min: 1, max: 1000 }).withMessage("Le texte de l'avis est requis (1000 caractères max)."),
  body('note').optional().isInt({ min: 1, max: 5 }).withMessage('La note doit être comprise entre 1 et 5.'),
  body('source').optional().isIn(SOURCES).withMessage('Source invalide.'),
  body('visible').optional().isBoolean().withMessage('Visible doit être un booléen.'),
  body('position').optional().isInt({ min: 0, max: 999 }).withMessage('Position invalide.'),
];

// Validateurs de création : l'auteur et le texte deviennent obligatoires,
// les autres champs restent validés par les règles communes ci-dessus.
const reviewCreateValidators = [
  body('auteur').trim().isLength({ min: 1, max: 80 }).withMessage("Le nom de l'auteur est requis (80 caractères max)."),
  body('texte').trim().isLength({ min: 1, max: 1000 }).withMessage("Le texte de l'avis est requis (1000 caractères max)."),
  ...reviewValidators.slice(1),
];

// -------- POST /api/reviews — ADMIN ONLY --------
router.post('/', authMiddleware, reviewCreateValidators, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

  const {
    auteur,
    localite = '',
    texte,
    note = 5,
    source = 'Google',
    visible = true,
  } = req.body;

  try {
    let { position } = req.body;
    if (position === undefined) {
      const maxRow = await get('SELECT MAX(position) as maxPos FROM reviews');
      position = (maxRow && maxRow.maxPos ? maxRow.maxPos : 0) + 1;
    }

    const result = await db.execute({
      sql: 'INSERT INTO reviews (auteur, localite, texte, note, source, visible, position) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [auteur, localite, texte, note, source, visible ? 1 : 0, position],
    });
    const newId = Number(result.lastInsertRowid);
    const created = await get('SELECT * FROM reviews WHERE id = ?', [newId]);
    return res.status(201).json({ success: true, review: created });
  } catch (err) {
    return res.status(500).json({ error: "Erreur lors de la création de l'avis." });
  }
});

// -------- PUT /api/reviews/:id — ADMIN ONLY --------
router.put(
  '/:id',
  authMiddleware,
  [param('id').isInt().withMessage('ID invalide.'), ...reviewValidators],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const { id } = req.params;
    const { auteur, localite, texte, note, source, visible, position } = req.body;

    try {
      const review = await get('SELECT id FROM reviews WHERE id = ?', [id]);
      if (!review) return res.status(404).json({ error: 'Avis introuvable.' });

      if (auteur !== undefined)   await run('UPDATE reviews SET auteur = ? WHERE id = ?', [auteur, id]);
      if (localite !== undefined) await run('UPDATE reviews SET localite = ? WHERE id = ?', [localite, id]);
      if (texte !== undefined)    await run('UPDATE reviews SET texte = ? WHERE id = ?', [texte, id]);
      if (note !== undefined)     await run('UPDATE reviews SET note = ? WHERE id = ?', [note, id]);
      if (source !== undefined)   await run('UPDATE reviews SET source = ? WHERE id = ?', [source, id]);
      if (visible !== undefined)  await run('UPDATE reviews SET visible = ? WHERE id = ?', [visible ? 1 : 0, id]);
      if (position !== undefined) await run('UPDATE reviews SET position = ? WHERE id = ?', [position, id]);

      const updated = await get('SELECT * FROM reviews WHERE id = ?', [id]);
      return res.json({ success: true, review: updated });
    } catch (err) {
      return res.status(500).json({ error: "Erreur lors de la mise à jour de l'avis." });
    }
  }
);

// -------- DELETE /api/reviews/:id — ADMIN ONLY --------
router.delete(
  '/:id',
  authMiddleware,
  [param('id').isInt().withMessage('ID invalide.')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const { id } = req.params;
    try {
      const review = await get('SELECT id FROM reviews WHERE id = ?', [id]);
      if (!review) return res.status(404).json({ error: 'Avis introuvable.' });

      await run('DELETE FROM reviews WHERE id = ?', [id]);
      return res.json({ success: true, message: 'Avis supprimé définitivement.' });
    } catch (err) {
      return res.status(500).json({ error: 'Erreur lors de la suppression.' });
    }
  }
);

module.exports = router;
