# Guide de Déploiement Heroku — Dashboard Comptabilité Relais IT

## ⚠️ Avertissement important — SQLite sur Heroku

**Heroku utilise un filesystem éphémère.** Cela signifie que la base de données SQLite sera **perdue à chaque redémarrage du dyno** (toutes les 24h minimum + à chaque nouveau déploiement).

### Solutions

| Option | Persistance | Coût | Recommandé |
|---|---|---|---|
| **A — SQLite (démo/test uniquement)** | ❌ Perdue après redémarrage | Gratuit | Pour tester l'UI rapidement |
| **B — Heroku Postgres (Hobby Dev)** | ✅ Persistance | Gratuit (10 000 lignes max) | ✅ Recommandé pour usage réel |

Ce guide couvre **l'Option A** (déploiement rapide). Pour l'Option B, voir la section "Migrer vers PostgreSQL" à la fin.

---

## Prérequis

1. **Compte Heroku** : [https://signup.heroku.com](https://signup.heroku.com) (gratuit)
2. **Heroku CLI** : [https://devcenter.heroku.com/articles/heroku-cli](https://devcenter.heroku.com/articles/heroku-cli)
3. **Git** : installé et configuré
4. **Node.js 20+** : installé localement

---

## 1. Vérifier les configurations du projet

Les modifications suivantes ont déjà été apportées au projet :

### `Procfile` (à la racine)
```
web: cd backend && node server.js
```

### `package.json` (à la racine)
```json
{
  "scripts": {
    "heroku-postbuild": "npm run build:frontend && npm run install:backend",
    "build:frontend": "cd frontend && npm install --include=dev && npm run build",
    "install:backend": "cd backend && npm install",
    "start": "cd backend && node server.js"
  },
  "engines": { "node": "20.x" }
}
```

### `frontend/src/lib/api.ts`
```typescript
const isProd = (import.meta as any).env?.PROD;
export const api = axios.create({
  baseURL: isProd ? '/api' : 'http://localhost:3001/api',
  ...
});
```
→ En production, l'API est servie depuis le même domaine (`/api`).

---

## 2. Initialiser Git (si pas déjà fait)

```bash
cd dashboard-comptabilite-ci

git init
git add .
git commit -m "Initial commit for Heroku deployment"
```

---

## 3. Créer l'application Heroku

```bash
# Se connecter à Heroku
heroku login

# Créer l'application (nom unique, ex: relais-it-compta)
heroku create relais-it-compta

# Si le nom est déjà pris, Heroku génère un nom aléatoire
# heroku create
```

---

## 4. Déployer

```bash
# Pousser le code sur Heroku
git push heroku main

# Ou si la branche s'appelle autrement
git push heroku master:main
```

Heroku va automatiquement :
1. Détecter Node.js
2. Exécuter `npm install` à la racine
3. Exécuter `npm run heroku-postbuild` (build le frontend + installe le backend)
4. Exécuter `npm start` (démarre le serveur)

---

## 5. Vérifier le déploiement

```bash
# Voir les logs en temps réel
heroku logs --tail

# Ouvrir l'application dans le navigateur
heroku open
```

L'URL sera : `https://relais-it-compta.herokuapp.com`

---

## 6. Commandes Heroku utiles

```bash
# Voir les logs
heroku logs --tail

# Redémarrer l'application
heroku restart

# Voir les variables d'environnement
heroku config

# Définir une variable d'environnement
heroku config:set MA_VARIABLE=ma_valeur

# Accéder à la console du dyno
heroku run bash

# Voir les dynos actifs
heroku ps
```

---

## 7. Limitations de la formule gratuite

### Heroku Free Dyno
- **Heures disponibles** : 550h/mois (environ 18h/jour)
- **Sleep** : après 30 min d'inactivité, le dyno s'endort
- **Premier accès** : ~5-10 secondes pour réveiller le dyno ("cold start")
- **Redémarrage quotidien** : tous les 24h minimum

### SQLite (Option A)
- ❌ **Données perdues** à chaque redémarrage ou déploiement
- ❌ Pas de sauvegarde automatique
- ✅ Suffisant pour une démo ou un test

---

## 8. Migrer vers PostgreSQL (Option B — Recommandé)

### 8.1 Ajouter l'addon PostgreSQL

```bash
heroku addons:create heroku-postgresql:hobby-dev
```

### 8.2 Modifier le backend pour utiliser PostgreSQL

Créer un fichier `backend/database-postgres.js` :

```javascript
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = { pool };
```

Modifier `backend/database.js` pour utiliser PostgreSQL si `DATABASE_URL` est défini :

```javascript
if (process.env.DATABASE_URL) {
  // Utiliser PostgreSQL
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  // Adapter les requêtes SQLite → PostgreSQL
} else {
  // Utiliser SQLite (développement local)
  // ... code SQLite existant
}
```

### 8.3 Adapter les requêtes SQL

Différences SQLite → PostgreSQL :

| SQLite | PostgreSQL |
|---|---|
| `INTEGER PRIMARY KEY AUTOINCREMENT` | `SERIAL PRIMARY KEY` |
| `TEXT` | `TEXT` |
| `CURRENT_TIMESTAMP` | `CURRENT_TIMESTAMP` |
| `?` | `$1, $2, ...` |
| `strftime('%Y-%m', date)` | `TO_CHAR(date, 'YYYY-MM')` |

### 8.4 Installer pg

```bash
cd backend
npm install pg
```

---

## 9. Dépanage

### Problème : "Application error"
```bash
heroku logs --tail
```
→ Vérifier les erreurs dans les logs.

### Problème : "Cannot GET /api/..."
→ Vérifier que le backend sert bien le frontend depuis `frontend/dist`.
→ Vérifier que `Procfile` est bien présent à la racine.

### Problème : "Module not found"
→ Vérifier que `package.json` racine a bien les scripts `build:frontend` et `install:backend`.

### Problème : Le frontend affiche une page blanche
→ Vérifier que `npm run build` a généré `frontend/dist/index.html`.
→ Vérifier que le backend logue : `Frontend dist exists: true`.

---

## 10. Récapitulatif des fichiers créés pour Heroku

| Fichier | Rôle |
|---|---|
| `Procfile` | Commande de démarrage du dyno |
| `package.json` (racine) | Scripts de build et démarrage |
| `.gitignore` | Exclusions Git |

---

## Résumé des commandes (copier-coller)

```bash
# 1. Se connecter
heroku login

# 2. Créer l'app
heroku create relais-it-compta

# 3. Déployer
git push heroku main

# 4. Vérifier
heroku logs --tail
heroku open
```

---

## Besoin d'aide ?

- [Heroku Dev Center](https://devcenter.heroku.com/)
- [Heroku Node.js Support](https://devcenter.heroku.com/articles/nodejs-support)
- [Heroku PostgreSQL](https://devcenter.heroku.com/articles/heroku-postgresql)
