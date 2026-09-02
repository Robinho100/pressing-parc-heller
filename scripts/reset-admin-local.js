/*
 * Réinitialise le compte administrateur de la base LOCALE de développement
 * (data/pressing.db). N'a aucun effet sur la production (base séparée).
 *
 * Usage :  node scripts/reset-admin-local.js [email] [motDePasse]
 * Défauts : email = pressingparcheller@yahoo.fr
 *           motDePasse = Pressing2026!
 */
const path = require('path');
const bcrypt = require('bcryptjs');
const { createClient } = require('@libsql/client');

const email = (process.argv[2] || 'pressingparcheller@yahoo.fr').trim().toLowerCase();
const password = process.argv[3] || 'Pressing2026!';

const dbPath = path.join(__dirname, '..', 'data', 'pressing.db');
const db = createClient({ url: `file:${dbPath}` });

(async () => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS admin (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      email    TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    );
  `);
  const hash = await bcrypt.hash(password, 12);
  await db.execute('DELETE FROM admin');
  await db.execute({
    sql: 'INSERT INTO admin (email, password) VALUES (?, ?)',
    args: [email, hash],
  });
  console.log('\n✅ Compte admin LOCAL réinitialisé');
  console.log('   Email        : ' + email);
  console.log('   Mot de passe : ' + password);
  console.log('   → http://localhost:3000/admin/\n');
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
