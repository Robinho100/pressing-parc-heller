# Guide de déploiement — Pressing du Parc Heller

Application Node.js (Express) + base de données libSQL/SQLite.

---

## 1. Architecture des fichiers

- `public/` — **seul dossier exposé publiquement** (site, images, `mentions-legales.html`, `404.html`, espace `admin/`).
- `server/` — code serveur : **jamais** servi via HTTP.
- `data/` — base SQLite locale de développement (`data/pressing.db`, ignorée par git).
- En production, la base est **Turso** (cloud) : aucun fichier local, aucun volume à monter.

Le serveur ne sert que `public/`. Ne jamais remettre `express.static` sur la racine du projet
(cela exposerait le code, la base, `.git` et la configuration).

---

## 2. Variables d'environnement

| Variable | Obligatoire | Rôle |
|---|---|---|
| `NODE_ENV` | oui | `production` en ligne (active cookies `Secure`, HSTS, contrôles stricts). |
| `JWT_SECRET` | **oui en prod** | Clé de signature des sessions admin. Le serveur refuse de démarrer sans elle en production. Sur Render : `generateValue: true`. |
| `ADMIN_EMAIL` | recommandé | Email de connexion à l'espace admin (défaut : `pressingparcheller@yahoo.fr`). |
| `ADMIN_INITIAL_PASSWORD` | **oui en prod** | Mot de passe du compte admin, utilisé **une seule fois** à la création du compte. Le serveur refuse de démarrer sans elle en production si le compte n'existe pas encore. |
| `TURSO_DATABASE_URL` | oui en prod | URL de la base Turso. |
| `TURSO_AUTH_TOKEN` | oui en prod | Jeton d'accès Turso. |

> **Aucun identifiant par défaut n'est présent dans le code.** En développement local, si
> `ADMIN_INITIAL_PASSWORD` n'est pas défini, un mot de passe temporaire aléatoire est généré
> et affiché **une seule fois** dans la console au premier démarrage.

---

## 3. Déploiement sur Render (recommandé)

1. Créer une base **Turso** (offre gratuite) et récupérer `Database URL` + `Auth Token`.
2. Sur Render : **New → Blueprint**, connecter le dépôt GitHub. Render lit `render.yaml`.
3. Renseigner les variables `sync: false` : `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`,
   `ADMIN_EMAIL`, `ADMIN_INITIAL_PASSWORD`. `JWT_SECRET` est généré automatiquement.
4. Déployer. Render fournit le HTTPS et l'URL `*.onrender.com`.
5. **Se connecter à `/admin`, aller dans « Mon compte », changer le mot de passe**,
   puis **supprimer la variable `ADMIN_INITIAL_PASSWORD`** dans le dashboard Render.
6. Ajouter le domaine personnalisé (`pressing-parc-heller.fr`) dans *Settings → Custom Domain*
   et poser les enregistrements DNS indiqués chez le registrar.

---

## 4. Déploiement sur VPS (alternative)

1. Node.js v18+ et Git installés.
2. `git clone` du dépôt, puis `npm ci --omit=dev`.
3. Définir les variables d'environnement (fichier `.env` non commité, ou service systemd).
4. Lancer avec **PM2** :
   ```bash
   npm install -g pm2
   pm2 start server/index.js --name pressing-heller
   pm2 startup && pm2 save
   ```
5. **Nginx** en proxy inverse vers `http://localhost:3000` + **Certbot / Let's Encrypt** pour le TLS :
   ```bash
   sudo certbot --nginx -d pressing-parc-heller.fr -d www.pressing-parc-heller.fr
   ```
   Le proxy doit transmettre `X-Forwarded-*` (l'application fait confiance à 1 hop de proxy).

---

## 5. Checklist post-déploiement

1. Vérifier que `https://<domaine>/server/index.js`, `/data/pressing.db`, `/.git/config`,
   `/package.json`, `/DEPLOYMENT.md` renvoient **404** (rien d'autre que `public/` ne doit sortir).
2. Se connecter à `/admin`, changer le mot de passe, supprimer `ADMIN_INITIAL_PASSWORD`.
3. Onglet **Coordonnées & Horaires** : renseigner les informations réelles + la carte Google Maps.
4. Vérifier les **Mentions légales** (`/mentions-legales.html`).
5. Sauvegarde : exporter régulièrement les données depuis le dashboard Turso.
