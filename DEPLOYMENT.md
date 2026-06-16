# Guide de Déploiement en Production — Pressing du Parc Heller

Ce document décrit les étapes nécessaires pour déployer l'application Node.js + SQLite du Pressing du Parc Heller sur un serveur de production ou sur une plateforme cloud, en garantissant la persistance des données et la sécurité.

---

## 1. Choix de l'Hébergement & Persistance SQLite

Comme l'application utilise **SQLite** (une base de données locale dans un fichier `data/pressing.db`), il est crucial de s'assurer que le système de fichiers de l'hébergeur ne détruit pas les données locales lors d'un redémarrage.

### Option A : Hébergement Cloud (Recommandé - Simple)
Des plateformes comme **Render.com** ou **Railway.app** permettent de déployer des applications Node.js très facilement.
* **Volume Persistant** : Vous devez attacher un **Volume Persistant** (ex: taille de 1 Go) et le monter sur le dossier `data/` du projet.
* **Variables d'environnement** :
  * `NODE_ENV=production` (active automatiquement les cookies sécurisés `Secure`).
  * `PORT=3000` (ou le port imposé par le service).
  * `JWT_SECRET=une-cle-secrete-tres-longue-et-aleatoire` (changez la clé par défaut !).

### Option B : VPS (Serveur Dédié Virtuel - OVH, Hostinger, Scaleway)
C'est l'option offrant le contrôle total et la persistance native de la base de données.
1. Installer Node.js (v18+) et Git sur le VPS.
2. Cloner le projet : `git clone https://github.com/Robinho100/pressing-parc-heller.git`.
3. Installer les dépendances : `npm install --omit=dev`.
4. Utiliser **PM2** pour exécuter le serveur en tâche de fond et le relancer automatiquement en cas de crash :
   ```bash
   npm install -g pm2
   NODE_ENV=production JWT_SECRET=VotreCleSecrete pm2 start server/index.js --name "pressing-heller"
   pm2 startup
   pm2 save
   ```

---

## 2. Configuration du Nom de Domaine & HTTPS

Pour des raisons de sécurité, **le site doit impérativement tourner en HTTPS**. Le cookie d'administration JWT est configuré pour n'être transmis que sur des connexions sécurisées en mode production.

### Option Cloud (Render/Railway)
* Ces plateformes gèrent l'attribution du SSL automatiquement. 
* Il suffit d'ajouter votre domaine personnalisé (ex: `pressing-parc-heller.fr`) dans les paramètres de la plateforme et de configurer vos enregistrements CNAME/A chez votre bureau d'enregistrement DNS (OVH, Gandi, etc.).

### Option VPS (Nginx + Let's Encrypt)
Configurez un proxy inverse avec **Nginx** et installez un certificat SSL gratuit avec **Certbot / Let's Encrypt** :
1. Installer Nginx : `sudo apt install nginx`
2. Créer une configuration de site dans `/etc/nginx/sites-available/pressing-heller` :
   ```nginx
   server {
       listen 80;
       server_name pressing-parc-heller.fr www.pressing-parc-heller.fr;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
3. Activer le site : `sudo ln -s /etc/nginx/sites-available/pressing-heller /etc/nginx/sites-enabled/` et redémarrer Nginx (`sudo systemctl restart nginx`).
4. Installer le SSL : 
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d pressing-parc-heller.fr -d www.pressing-parc-heller.fr
   ```

---

## 3. Liste des Tâches post-déploiement

Une fois le site en ligne sur internet :
1. **Accéder à l'Admin** : Allez sur `https://votre-domaine.fr/admin` et connectez-vous avec l'email du client et le mot de passe temporaire (`Admin2025!`).
2. **Modifier le profil** : Rendez-vous dans l'onglet **Mon compte** et modifiez le mot de passe pour en définir un très fort et personnel.
3. **Vérifier les coordonnées** : Allez dans l'onglet **Coordonnées & Horaires**, entrez les informations finales réelles du pressing et mettez à jour la carte Google Maps.
4. **Vérifier le formulaire de contact** : Faites un envoi d'essai depuis le site public et vérifiez qu'il apparaît bien en haut de la liste dans l'onglet **Messages** de l'admin.
5. **Sauvegarde** : Configurez une sauvegarde régulière du fichier `data/pressing.db` ou utilisez périodiquement le bouton **Sauvegarder la base de données** depuis l'administration.
