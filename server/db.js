const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH  = path.join(DATA_DIR, 'pressing.db');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

let db;

async function initDb() {
  const SQL = await initSqlJs();

  // Charger la DB depuis le disque si elle existe, sinon créer
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // -------- TABLES --------
  db.run(`
    CREATE TABLE IF NOT EXISTS admin (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      email    TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    );
  `);

  db.run(`
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

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  db.run(`
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
  const adminRow = db.exec("SELECT id, email FROM admin");
  if (!adminRow.length || !adminRow[0].values.length) {
    const hash = bcrypt.hashSync('Admin2025!', 12);
    db.run('INSERT INTO admin (email, password) VALUES (?, ?)', ['pressingparcheller@yahoo.fr', hash]);
    console.log('✅ Compte admin créé : pressingparcheller@yahoo.fr / Admin2025!');
    save();
  } else {
    // Si l'ancienne adresse par défaut est présente, la mettre à jour vers la nouvelle adresse pro
    const currentEmail = adminRow[0].values[0][1];
    if (currentEmail === 'admin@pressing-parc-heller.com') {
      db.run("UPDATE admin SET email = 'pressingparcheller@yahoo.fr' WHERE email = 'admin@pressing-parc-heller.com'");
      console.log('🔄 Email admin mis à jour vers : pressingparcheller@yahoo.fr');
      save();
    }
  }

  // -------- SEED SETTINGS --------
  const settingsCountRow = db.exec('SELECT COUNT(*) FROM settings');
  const settingsCount = settingsCountRow.length && settingsCountRow[0].values.length ? settingsCountRow[0].values[0][0] : 0;
  if (settingsCount === 0) {
    const defaultSettings = [
      ['contact_email',      'pressingparcheller@yahoo.fr'],
      ['contact_phone',      '01 42 37 47 48'],
      ['contact_address',    '50 Rue Prosper Legouté, 92160 Antony'],
      ['hours_week',         '9h–12h30 · 14h–19h'],
      ['hours_sat',          '9h–13h · 13h30–19h'],
      ['google_maps_iframe', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2636.0!2d2.2996!3d48.7531!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47e67172b01f7ce1%3A0x82c3b0f3bef3e2c0!2s50%20Rue%20Prosper%20Legout%C3%A9%2C%2092160%20Antony!5e0!3m2!1sfr!2sfr!4v1718461234567!5m2!1sfr!2sfr']
    ];
    defaultSettings.forEach(([k, v]) => {
      db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [k, v]);
    });
    console.log('✅ Coordonnées et horaires par défaut insérés.');
    save();
  }

  // -------- SEED SERVICES --------
  const countRow = db.exec('SELECT COUNT(*) as count FROM services');
  const count = countRow[0].values[0][0];
  if (count === 0) {
    const services = [
      ['costumes',      'Costumes & Tailleurs',   'Nettoyage à sec professionnel, rendu impeccable.',          'à partir de 15€', '👔'],
      ['mariage',       'Robe de Mariée',          'Traitement délicat et spécialisé, conservation incluse.',   'à partir de 80€', '👗'],
      ['chemises',      'Chemises à la main',      'Repassage minutieux à la main, résultat parfait.',          'à partir de 4€',  '👕'],
      ['doudounes',     'Doudounes en duvet',      "Nettoyage spécialisé, restitution du volume d'origine.",   'à partir de 18€', '🧥'],
      ['cuir',          'Cuir & Peaux',            'Nettoyage, nourrissage et protection de vos articles.',     'à partir de 25€', '🧣'],
      ['rideaux',       'Rideaux & Linge',         'Nettoyage et repassage, rendu soigné et parfumé.',          'à partir de 12€', '🪟'],
      ['couture',       'Couture & Réparation',    'Retouches et réparations par nos couturières expertes.',    'à partir de 5€',  '🧵'],
      ['blanchisserie', 'Blanchisserie',           'Lavage, séchage et repassage de votre linge.',              'à partir de 3€',  '🫧'],
      ['livraison',     'Livraison à domicile',    'Collecte et livraison gratuite pour plus de commodité.',    'Gratuite',        '🚚'],
      ['colissimo',     'Colissimo',               'Dépôt et retrait de vos colis Colissimo.',                  'Sur place',        '📦'],
    ];
    services.forEach(s => {
      db.run('INSERT INTO services (slug, nom, description, prix, emoji) VALUES (?, ?, ?, ?, ?)', s);
    });
    console.log('✅ Services insérés en base.');
    save();
  }

  // S'assurer que le service colissimo existe (migration pour les bases de données existantes)
  const colissimoExists = db.exec("SELECT COUNT(*) FROM services WHERE slug = 'colissimo'");
  const existsVal = colissimoExists.length && colissimoExists[0].values.length ? colissimoExists[0].values[0][0] : 0;
  if (existsVal === 0) {
    db.run("INSERT INTO services (slug, nom, description, prix, emoji) VALUES (?, ?, ?, ?, ?)", [
      'colissimo',
      'Colissimo',
      'Dépôt et retrait de vos colis Colissimo.',
      'Sur place',
      '📦'
    ]);
    save();
    console.log('✅ Service Colissimo inséré.');
  }

  console.log('✅ Base de données initialisée.');
  return db;
}

// Sauvegarde sur disque après chaque modification
function save() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// Helpers pour exécuter des requêtes facilement
function query(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function run(sql, params = []) {
  db.run(sql, params);
  save();
}

function get(sql, params = []) {
  const rows = query(sql, params);
  return rows[0] || null;
}

module.exports = { initDb, query, run, get, save };
