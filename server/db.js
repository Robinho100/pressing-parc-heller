const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Connexion Turso (cloud) si configurée, sinon fichier SQLite local.
const LOCAL_DB_PATH = path.join(__dirname, '..', 'data', 'pressing.db');
if (!process.env.TURSO_DATABASE_URL) {
  // S'assurer que le dossier data/ existe (absent après un git clone : il est gitignoré).
  fs.mkdirSync(path.dirname(LOCAL_DB_PATH), { recursive: true });
}

const db = createClient({
  url: process.env.TURSO_DATABASE_URL || `file:${LOCAL_DB_PATH}`,
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
  // Aucun mot de passe par défaut dans le code.
  //  - En production : ADMIN_INITIAL_PASSWORD (et éventuellement ADMIN_EMAIL) sont obligatoires.
  //  - En développement : un mot de passe temporaire aléatoire est généré et affiché une seule fois.
  // Le compte n'est créé qu'une fois ; changez ce mot de passe via « Mon compte » dès la 1re connexion.
  const adminRow = await db.execute('SELECT id, email FROM admin');
  if (!adminRow.rows.length) {
    const email = (process.env.ADMIN_EMAIL || 'pressingparcheller@yahoo.fr').trim().toLowerCase();
    let password = process.env.ADMIN_INITIAL_PASSWORD;
    let generated = false;

    if (!password) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          'ADMIN_INITIAL_PASSWORD manquant : définissez-le pour créer le compte administrateur en production.'
        );
      }
      password = crypto.randomBytes(9).toString('base64').replace(/[^A-Za-z0-9]/g, '') + 'Aa1!';
      generated = true;
    }

    const hash = await bcrypt.hash(password, 12);
    await db.execute({
      sql: 'INSERT INTO admin (email, password) VALUES (?, ?)',
      args: [email, hash],
    });

    console.log('\n============================================');
    console.log('  COMPTE ADMINISTRATEUR CRÉÉ');
    console.log('  Email : ' + email);
    if (generated) {
      console.log('  Mot de passe temporaire (dev) : ' + password);
      console.log('  → Changez-le immédiatement dans « Mon compte ».');
    } else {
      console.log('  Mot de passe : défini via ADMIN_INITIAL_PASSWORD');
      console.log('  → Changez-le dès la 1re connexion, puis supprimez la variable.');
    }
    console.log('============================================\n');
  }

  // -------- SEED SETTINGS --------
  const settingsCount = await db.execute('SELECT COUNT(*) as count FROM settings');
  if (!settingsCount.rows[0].count) {
    const defaultSettings = [
      ['contact_phone',      '01 42 37 47 48'],
      ['contact_address',    '50 Rue Prosper Legouté, 92160 Antony'],
      ['hours_week',         '9h–12h30 · 14h–19h'],
      ['hours_thursday',     '9h–12h30 · 15h–19h'],
      ['hours_sat',          '9h–19h sans interruption'],
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
      ['mariage',       'Robe de Mariée',          'Soin délicat & nettoyage spécialisé', 'Sur devis', '-'],
      ['chemises',      'Chemises à la main',      'Repassage méticuleux fait main',     'Sur devis', '-'],
      ['doudounes',     'Doudounes en duvet',      'Lavage & traitement spécial gonflant','Sur devis', '-'],
      ['cuir',          'Cuir et Peaux',            'Nettoyage cuir, daim & ameublement', 'Sur devis', '-'],
      ['rideaux',       'Rideaux et Linge',         'Rideaux, voilages & housses de canapé','Sur devis','-'],
      ['couture',       'Couture et Réparation',    'Retouches, ourlets & stoppage',      'Sur devis', '-'],
      ['blanchisserie', 'Blanchisserie',           'Lavage, séchage & pliage soigné',    'Sur devis', '-'],
      ['cordonnerie',   'Dépôt de Cordonnerie',    'Réparation & entretien de chaussures','Sur devis', '-'],
    ];
    for (const s of services) {
      await db.execute({
        sql: 'INSERT INTO services (slug, nom, description, prix, emoji) VALUES (?, ?, ?, ?, ?)',
        args: s,
      });
    }
    console.log('✅ Services insérés en base.');
  }

  // Migrations : synchronisation des services et paramètres
  await db.execute("DELETE FROM services WHERE slug = 'nettoyage'");
  await db.execute("DELETE FROM services WHERE slug = 'costumes'");
  await db.execute("DELETE FROM services WHERE slug = 'colissimo'");
  await db.execute("DELETE FROM services WHERE slug = 'livraison'");
  await db.execute("INSERT OR IGNORE INTO services (slug, nom, description, prix, emoji) VALUES ('cordonnerie', 'Dépôt de Cordonnerie', 'Réparation & entretien de chaussures', 'Sur devis', '👞')");
  await db.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('hours_sat', '9h–19h sans interruption')");

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
