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
      emoji       TEXT NOT NULL DEFAULT '•',
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

  await db.execute(`
    CREATE TABLE IF NOT EXISTS reviews (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      auteur     TEXT NOT NULL,
      localite   TEXT NOT NULL DEFAULT '',
      texte      TEXT NOT NULL,
      note       INTEGER NOT NULL DEFAULT 5,
      source     TEXT NOT NULL DEFAULT 'Google',
      visible    INTEGER NOT NULL DEFAULT 1,
      position   INTEGER NOT NULL DEFAULT 0,
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
    // Pas de description par défaut : elle ne s'affiche sur le site que si
    // l'admin en saisit une explicitement.
    const services = [
      ['mariage',       'Robe de Mariée',          '', 'Sur devis', '-'],
      ['chemises',      'Chemises à la main',      '', 'Sur devis', '-'],
      ['doudounes',     'Doudounes en duvet',      '', 'Sur devis', '-'],
      ['cuir',          'Cuir et Peaux',           '', 'Sur devis', '-'],
      ['rideaux',       'Rideaux et Linge',        '', 'Sur devis', '-'],
      ['couture',       'Couture et Réparation',   '', 'Sur devis', '-'],
      ['blanchisserie', 'Blanchisserie',           '', 'Sur devis', '-'],
      ['cordonnerie',   'Dépôt de Cordonnerie',    '', 'Sur devis', '-'],
    ];
    for (const s of services) {
      await db.execute({
        sql: 'INSERT INTO services (slug, nom, description, prix, emoji) VALUES (?, ?, ?, ?, ?)',
        args: s,
      });
    }
    console.log('✅ Services insérés en base.');
  }

  // -------- SEED AVIS --------
  const reviewsCount = await db.execute('SELECT COUNT(*) as count FROM reviews');
  if (!reviewsCount.rows[0].count) {
    const reviews = [
      ['Bénédicte', 'Antony', "Un travail de grande qualité. Si vous cherchez un bon pressing c'est la bonne adresse ! Mon manteau taché de peinture et couvert de bouloches est revenu comme neuf ! C'est un peu plus cher mais on s'y retrouve largement en rapport qualité/prix.", 5, 'Google', 1],
      ['Sophie', 'Antony', "Très bon travail. Ils ont sauvé ma robe fétiche. Je la croyais fichue car après deux passages dans deux pressings ils n'ont rien pu faire, mais eux ils ont réussi — alors Merci !", 5, 'Google', 2],
      ['M. Dupra', 'Antony', "J'ai trouvé dans ce pressing un très bon accueil et de très bons professionnels. Ayant subi un sinistre, ma garde-robe paraissait fichue. Ce pressing a fait preuve d'un grand professionnalisme et m'a sauvé la plupart de mes vêtements ! Merci à eux.", 5, 'Pages Jaunes', 3],
    ];
    for (const r of reviews) {
      await db.execute({
        sql: 'INSERT INTO reviews (auteur, localite, texte, note, source, position) VALUES (?, ?, ?, ?, ?, ?)',
        args: r,
      });
    }
    console.log('✅ Avis clients insérés en base.');
  }

  // Avis non vérifiés (repris de l'ancien site WEBCELOS, jamais confirmés comme
  // réels) : on les retire définitivement, y compris sur une base déjà seedée
  // (ex. prod) où le bloc de seed ci-dessus ne s'exécute plus.
  await db.execute({
    sql: `DELETE FROM reviews WHERE auteur IN (?, ?, ?, ?)
      AND texte IN (?, ?, ?, ?)`,
    args: [
      'Paul', 'Jacques Brossard', 'JM Paceux', 'Christine',
      'Très bon pressing. Des gens sympathiques et professionnels qui connaissent leur métier. 10 ans que je fais nettoyer mes costumes dans cet établissement. De loin le meilleur pressing des alentours.',
      "Venant d'être victime d'un incendie qui a ravagé notre appartement, nous avons trouvé auprès du Pressing du Parc Heller une aide technique des plus efficaces dans les délais les plus courts. Grâce à leur compétence, un grand nombre de vêtements ont pu être sauvés. Merci très sincèrement.",
      "Je cherchais un bon pressing depuis longtemps et je vous recommande celui-ci. Travail très bien fait par des professionnels. Si vous avez des vêtements de qualité je vous le conseille, de plus l'accueil est agréable. Parking facile, rue en sens unique.",
      "Matériel à l'ancienne qui fonctionne très bien. Personnel accueillant et professionnel. Mes vêtements sont toujours rendus dans un état impeccable. Je recommande vivement cet établissement familial.",
    ],
  });

  // Migrations : synchronisation des services et paramètres
  await db.execute("DELETE FROM services WHERE slug = 'nettoyage'");
  await db.execute("DELETE FROM services WHERE slug = 'costumes'");
  await db.execute("DELETE FROM services WHERE slug = 'colissimo'");
  await db.execute("DELETE FROM services WHERE slug = 'livraison'");
  await db.execute("INSERT OR IGNORE INTO services (slug, nom, description, prix, emoji) VALUES ('cordonnerie', 'Dépôt de Cordonnerie', '', 'Sur devis', '👞')");
  await db.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('hours_sat', '9h–19h sans interruption')");

  // Descriptions : on repart de zéro. On efface UNIQUEMENT les descriptions
  // par défaut historiques (jamais une description saisie par l'admin ensuite,
  // qui ne correspondra pas à ces chaînes) → migration idempotente.
  await db.execute(`
    UPDATE services SET description = '' WHERE description IN (
      'Soin délicat & nettoyage spécialisé',
      'Repassage méticuleux fait main',
      'Lavage & traitement spécial gonflant',
      'Nettoyage cuir, daim & ameublement',
      'Rideaux, voilages & housses de canapé',
      'Retouches, ourlets & stoppage',
      'Lavage, séchage & pliage soigné',
      'Réparation & entretien de chaussures'
    )
  `);

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
