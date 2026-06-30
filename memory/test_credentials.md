# Test Credentials

L'application `dashboard-comptabilite-ci` est actuellement **sans authentification réelle**.
- L'`AuthContext` du frontend simule un utilisateur fictif (aucun appel API).
- Le backend Express n'a aucune route `/api/auth/*` ni middleware de protection.

## Identifiants
Aucun identifiant n'est nécessaire pour accéder aux pages. Tous les routes (sauf `/login`) sont accessibles directement.

## URL de test local
- Frontend + Backend servi par Express : `http://localhost:3001`
- API : `http://localhost:3001/api/*`

## Notes
- Si une page de login s'affiche, cliquer simplement sur le bouton "Se connecter" suffit (le formulaire est mocké).
- Aucun token JWT, cookie ou session réelle n'est utilisé en backend.
