const { query, run, get } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const { body, param, validationResult } = require('express-validator');

const router = require('express').Router();

// -------- RATE LIMITING : Max 3 messages / heure par IP (anti-spam) --------
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 3,
  message: { error: 'Trop de messages envoyés. Veuillez réessayer plus tard.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// -------- POST /api/contact — PUBLIC --------
// Soumet un message de contact
router.post(
  '/',
  contactLimiter,
  [
    body('nom')
      .trim()
      .isLength({ min: 2, max: 100 }).withMessage('Le nom doit faire entre 2 et 100 caractères.')
      .escape(),
    body('email')
      .trim()
      .isEmail().withMessage('Adresse email invalide.')
      .normalizeEmail(),
    body('sujet')
      .trim()
      .isLength({ min: 2, max: 150 }).withMessage('Le sujet doit faire entre 2 et 150 caractères.')
      .escape(),
    body('message')
      .trim()
      .isLength({ min: 10, max: 2000 }).withMessage('Le message doit faire entre 10 et 2000 caractères.')
      .escape(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { nom, email, sujet, message } = req.body;

    try {
      run(
        'INSERT INTO messages (nom, email, sujet, message) VALUES (?, ?, ?, ?)',
        [nom, email, sujet, message]
      );
      return res.json({ success: true, message: 'Votre message a bien été envoyé ! Nous vous répondrons dans les plus brefs délais.' });
    } catch (err) {
      return res.status(500).json({ error: 'Une erreur est survenue lors de l\'envoi du message.' });
    }
  }
);

// -------- GET /api/contact/messages — ADMIN ONLY --------
// Liste tous les messages
router.get('/messages', authMiddleware, (req, res) => {
  try {
    const messages = query('SELECT * FROM messages ORDER BY id DESC');
    return res.json({ messages });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors de la récupération des messages.' });
  }
});

// -------- GET /api/contact/messages/unread-count — ADMIN ONLY --------
// Renvoie le nombre de messages non lus
router.get('/messages/unread-count', authMiddleware, (req, res) => {
  try {
    const countRow = query('SELECT COUNT(*) as count FROM messages WHERE lu = 0');
    const count = countRow.length ? countRow[0].count : 0;
    return res.json({ count });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors de la récupération du compteur.' });
  }
});

// -------- PUT /api/contact/messages/:id/read — ADMIN ONLY --------
// Marque un message comme lu/non lu
router.put(
  '/messages/:id/read',
  authMiddleware,
  [
    param('id').isInt().withMessage('ID invalide.'),
    body('lu').isBoolean().withMessage('Le statut de lecture doit être un booléen.'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { id } = req.params;
    const { lu } = req.body;

    try {
      const msg = get('SELECT id FROM messages WHERE id = ?', [id]);
      if (!msg) {
        return res.status(404).json({ error: 'Message introuvable.' });
      }

      run('UPDATE messages SET lu = ? WHERE id = ?', [lu ? 1 : 0, id]);
      return res.json({ success: true, lu });
    } catch (err) {
      return res.status(500).json({ error: 'Erreur lors de la modification du statut.' });
    }
  }
);

// -------- DELETE /api/contact/messages/:id — ADMIN ONLY --------
// Supprime un message
router.delete(
  '/messages/:id',
  authMiddleware,
  [
    param('id').isInt().withMessage('ID invalide.'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { id } = req.params;

    try {
      const msg = get('SELECT id FROM messages WHERE id = ?', [id]);
      if (!msg) {
        return res.status(404).json({ error: 'Message introuvable.' });
      }

      run('DELETE FROM messages WHERE id = ?', [id]);
      return res.json({ success: true, message: 'Message supprimé.' });
    } catch (err) {
      return res.status(500).json({ error: 'Erreur lors de la suppression.' });
    }
  }
);

module.exports = router;
