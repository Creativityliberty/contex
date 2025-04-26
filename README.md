# Context7 MCP HTTP API

API HTTP pour interagir avec Context7 MCP (Upstash). Permet de résoudre des IDs de librairies et d'obtenir la documentation associée.

## 🚀 Lancement local

```bash
npm init -y
npm install express morgan
node server.js
```

## 🌐 Endpoints disponibles

| Méthode | Endpoint                | Body attendu                                      | Description                                          |
|---------|-------------------------|---------------------------------------------------|------------------------------------------------------|
| POST    | /resolve-library-id     | `{ "libraryName": "nom_librairie" }`             | Résout l’ID context7 d’une librairie                |
| POST    | /get-library-docs       | `{ "context7CompatibleLibraryID": "...", "topic": "...", "tokens": ... }` | Récupère la doc d’une librairie                     |
| POST    | /restart-context7       | `{}`                                             | Redémarre le process MCP Context7                   |
| GET     | /healthz                | —                                                | Vérifie que le serveur tourne                        |

## 🛡️ Sécurité

- ⚠️ Aucune clé d'API requise pour l'instant (démo/dev). Ajoutez le middleware d'auth plus tard pour la prod.

## 📝 Documentation OpenAPI

- Voir `openapi.yaml` pour une documentation Swagger complète.

## 🛠️ Déploiement Render

- Le serveur écoute sur `process.env.PORT` (nécessaire pour Render).
- Ajoutez la variable d'env `PORT` dans Render si besoin.
- Pour la robustesse, Render supervise automatiquement le process. Pour un usage local/PM2 :
  ```bash
  npm install -g pm2
  pm2 start server.js --name context7-api
  ```

## 🔄 Redémarrage MCP

- Utilisez `/restart-context7` pour relancer le process MCP sans redémarrer tout le serveur.

## 📚 Exemples de requêtes

```bash
curl -X POST http://localhost:3000/resolve-library-id \
  -H 'Content-Type: application/json' \
  -d '{"libraryName": "lodash"}'

curl -X POST http://localhost:3000/get-library-docs \
  -H 'Content-Type: application/json' \
  -d '{"context7CompatibleLibraryID": "npm:lodash@4.17.21", "topic": "map", "tokens": 256}'
```

---

**Pour toute évolution (auth, déploiement prod, intégration GPT, etc.), voir le code ou demander !**
# Contex
