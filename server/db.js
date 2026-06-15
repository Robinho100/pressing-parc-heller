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

  // -------- SEED ADMIN --------
  const adminRow = db.exec("SELECT id FROM admin WHERE email = 'admin@pressing-parc-heller.com'");
  if (!adminRow.length || !adminRow[0].values.length) {
    const hash = bcrypt.hashSync('Admin2025!', 12);
    db.run('INSERT INTO admin (email, password) VALUES (?, ?)', ['admin@pressing-parc-heller.com', hash]);
    console.log('✅ Compte admin créé : admin@pressing-parc-heller.com / Admin2025!');
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
      ['relais',        'Point Relais & Cordonnerie', 'Dépôt relais colis et réparation de chaussures en boutique.', 'Sur place',       '📦'],
    ];
    services.forEach(s => {
      db.run('INSERT INTO services (slug, nom, description, prix, emoji) VALUES (?, ?, ?, ?, ?)', s);
    });
    console.log('✅ Services insérés en base.');
    save();
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
