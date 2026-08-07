const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');

// Connexion Turso (cloud) ou SQLite local en dev
const db = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:data/pressing.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function initDb() {
  // -------- TABLES --------
  await db.execute(`
    CREATE TABLE IF NOT EXISTS admin (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      email    TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS services (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      slug        TEXT UNIQUE NOT NULL,
      nom         TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      prix        TEXT NOT NULL DEFAULT 'Sur devis',
      emoji       TEXT NOT NULL DEFAULT '✦',
      visible     INTEGER NOT NULL DEFAULT 1,
      updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS messages (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      nom        TEXT NOT NULL,
      email      TEXT NOT NULL,
      sujet      TEXT NOT NULL,
      message    TEXT NOT NULL,
      lu         INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // -------- SEED ADMIN --------
  const adminRow = await db.execute('SELECT id, email FROM admin');
  if (!adminRow.rows.length) {
    const hash = await bcrypt.hash('Admin2025!', 12);
    await db.execute({
      sql: 'INSERT INTO admin (email, password) VALUES (?, ?)',
      args: ['pressingparcheller@yahoo.fr', hash],
    });
    console.log('✅ Compte admin créé : pressingparcheller@yahoo.fr / Admin2025!');
  }

  // -------- SEED SETTINGS --------
  const settingsCount = await db.execute('SELECT COUNT(*) as count FROM settings');
  if (!settingsCount.rows[0].count) {
    const defaultSettings = [
      ['contact_email',      'pressingparcheller@yahoo.fr'],
      ['contact_phone',      '01 42 37 47 48'],
      ['contact_address',    '50 Rue Prosper Legouté, 92160 Antony'],
      ['hours_week',         '9h–12h30 · 14h–19h'],
      ['hours_thursday',     '9h–12h30 · 15h–19h'],
      ['hours_sat',          '9h–13h · 14h–19h'],
      ['google_maps_iframe', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2636.0!2d2.2996!3d48.7531!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47e67172b01f7ce1%3A0x82c3b0f3bef3e2c0!2s50%20Rue%20Prosper%20Legout%C3%A9%2C%2092160%20Antony!5e0!3m2!1sfr!2sfr!4v1718461234567!5m2!1sfr!2sfr'],
    ];
    for (const [k, v] of defaultSettings) {
      await db.execute({ sql: 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', args: [k, v] });
    }
    console.log('✅ Coordonnées et horaires par défaut insérés.');
  }

  // -------- SEED SERVICES --------
  const countRow = await db.execute('SELECT COUNT(*) as count FROM services');
  if (!countRow.rows[0].count) {
    const services = [
      ['costumes',      'Costumes et Tailleurs',   'Nettoyage à sec et repassage soigné de vos costumes, vestes et tailleurs.',  'à partir de 15€', '👔'],
      ['mariage',       'Robe de Mariée',          "Nettoyage délicat et préservation spécialisée de vos tenues d'exception.",   'à partir de 80€', '👗'],
      ['chemises',      'Chemises à la main',      'Repassage méticuleux réalisé à la main pour un résultat lisse et soigné.',     'à partir de 4€',  '👕'],
      ['doudounes',     'Doudounes en duvet',      "Lavage et séchage spécialisés pour restituer le volume d'origine.",          'à partir de 18€', '🧥'],
      ['cuir',          'Cuir et Peaux',            'Entretien expert, nettoyage et soin protecteur pour blousons en cuir et daim.','à partir de 25€', '🧣'],
      ['rideaux',       'Rideaux et Linge',         'Nettoyage et repassage de vos rideaux, voilages, nappes et linge de maison.', 'à partir de 12€', '🪟'],
      ['couture',       'Couture et Réparation',    'Retouches, ourlets et petites réparations effectués par nos couturières.',    'à partir de 5€',  '🧵'],
      ['blanchisserie', 'Blanchisserie',           'Lavage, séchage et pliage de votre linge de tous les jours.',                 'à partir de 3€',  '🫧'],
    ];
    for (const s of services) {
      await db.execute({
        sql: 'INSERT INTO services (slug, nom, description, prix, emoji) VALUES (?, ?, ?, ?, ?)',
        args: s,
      });
    }
    console.log('✅ Services insérés en base.');
  }

  // Migrations : supprimer les anciens services obsolètes
  await db.execute("DELETE FROM services WHERE slug = 'colissimo'");
  await db.execute("DELETE FROM services WHERE slug = 'livraison'");

  console.log('✅ Base de données initialisée.');
}

// Helpers async
async function query(sql, args = []) {
  const result = await db.execute({ sql, args });
  return result.rows;
}

async function run(sql, args = []) {
  await db.execute({ sql, args });
}

async function get(sql, args = []) {
  const rows = await query(sql, args);
  return rows[0] || null;
}

module.exports = { initDb, query, run, get, db };
