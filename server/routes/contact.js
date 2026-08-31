const { query, run, get } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const { body, param, validationResult } = require('express-validator');

const router = require('express').Router();

// -------- RATE LIMITING : Max 3 messages / heure par IP --------
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: 'Trop de messages envoyés. Veuillez réessayer plus tard.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// -------- POST /api/contact — DÉSACTIVÉ --------
// Le site ne comporte plus de formulaire de contact : aucune donnée personnelle
// n'est collectée en ligne (cf. mentions légales, section 4). L'endpoint est
// neutralisé pour rester cohérent avec la politique de confidentialité.
// Pour le réactiver : restaurer le handler ci-dessous ET remettre le paragraphe
// « formulaire de contact » dans mentions-legales.html avec une mention RGPD au
// point de collecte (case à cocher / lien vers la politique de confidentialité).
router.post('/', contactLimiter, (req, res) => {
  return res.status(410).json({ error: "Le formulaire de contact n'est pas disponible. Merci de nous joindre par téléphone." });
});

/* Handler d'origine, à restaurer si un formulaire est réintroduit :
router.post(
  '/',
  contactLimiter,
  [
    body('nom').trim().isLength({ min: 2, max: 100 }).withMessage('Le nom doit faire entre 2 et 100 caractères.').escape(),
    body('email').trim().isEmail().withMessage('Adresse email invalide.').normalizeEmail(),
    body('sujet').trim().isLength({ min: 2, max: 150 }).withMessage('Le sujet doit faire entre 2 et 150 caractères.').escape(),
    body('message').trim().isLength({ min: 10, max: 2000 }).withMessage('Le message doit faire entre 10 et 2000 caractères.').escape(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const { nom, email, sujet, message } = req.body;

    try {
      await run('INSERT INTO messages (nom, email, sujet, message) VALUES (?, ?, ?, ?)', [nom, email, sujet, message]);
      return res.json({ success: true, message: 'Votre message a bien été envoyé ! Nous vous répondrons dans les plus brefs délais.' });
    } catch (err) {
      return res.status(500).json({ error: "Une erreur est survenue lors de l'envoi du message." });
    }
  }
);
*/

// -------- GET /api/contact/messages — ADMIN ONLY --------
router.get('/messages', authMiddleware, async (req, res) => {
  try {
    const messages = await query('SELECT * FROM messages ORDER BY id DESC');
    return res.json({ messages });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors de la récupération des messages.' });
  }
});

// -------- GET /api/contact/messages/unread-count — ADMIN ONLY --------
router.get('/messages/unread-count', authMiddleware, async (req, res) => {
  try {
    const countRow = await query('SELECT COUNT(*) as count FROM messages WHERE lu = 0');
    const count = countRow.length ? countRow[0].count : 0;
    return res.json({ count });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors de la récupération du compteur.' });
  }
});

// -------- PUT /api/contact/messages/:id/read — ADMIN ONLY --------
router.put(
  '/messages/:id/read',
  authMiddleware,
  [
    param('id').isInt().withMessage('ID invalide.'),
    body('lu').isBoolean().withMessage('Le statut de lecture doit être un booléen.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const { id } = req.params;
    const { lu } = req.body;

    try {
      const msg = await get('SELECT id FROM messages WHERE id = ?', [id]);
      if (!msg) return res.status(404).json({ error: 'Message introuvable.' });

      await run('UPDATE messages SET lu = ? WHERE id = ?', [lu ? 1 : 0, id]);
      return res.json({ success: true, lu });
    } catch (err) {
      return res.status(500).json({ error: 'Erreur lors de la modification du statut.' });
    }
  }
);

// -------- DELETE /api/contact/messages/:id — ADMIN ONLY --------
router.delete(
  '/messages/:id',
  authMiddleware,
  [param('id').isInt().withMessage('ID invalide.')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const { id } = req.params;

    try {
      const msg = await get('SELECT id FROM messages WHERE id = ?', [id]);
      if (!msg) return res.status(404).json({ error: 'Message introuvable.' });

      await run('DELETE FROM messages WHERE id = ?', [id]);
      return res.json({ success: true, message: 'Message supprimé.' });
    } catch (err) {
      return res.status(500).json({ error: 'Erreur lors de la suppression.' });
    }
  }
);

module.exports = router;
