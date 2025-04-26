import express from 'express';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { searchLibraries, fetchLibraryDocumentation, formatSearchResults } from './api.js';

const app = express();
const port = process.env.PORT || 3000;

// Pour supporter __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir /.well-known statiquement (OpenAPI)
app.use('/.well-known', express.static(path.join(__dirname, '.well-known')));
const API_KEY = process.env.API_KEY || 'changeme'; // Pour Render, à définir dans les variables d'env

app.use(express.json());
app.use(morgan('combined'));

// Valeurs par défaut
const DEFAULT_TOKENS = 5000;

app.post('/resolve-library-id', async (req, res) => {
  const { libraryName } = req.body;
  if (!libraryName) {
    return res.status(400).json({ error: 'libraryName is required' });
  }
  
  try {
    // Recherche directe via l'API Context7
    const searchResponse = await searchLibraries(libraryName);
    
    if (!searchResponse || !searchResponse.results || searchResponse.results.length === 0) {
      return res.status(404).json({ error: 'No libraries found' });
    }
    
    // Prendre le premier résultat comme meilleure correspondance
    const bestMatch = searchResponse.results[0];
    
    // Retourner l'ID formaté selon le schéma OpenAPI
    return res.json({ resolvedLibraryId: bestMatch.id });
  } catch (error) {
    console.error('Error resolving library ID:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.post('/get-library-docs', async (req, res) => {
  const { context7CompatibleLibraryID, topic, tokens = DEFAULT_TOKENS } = req.body;
  
  if (!context7CompatibleLibraryID) {
    return res.status(400).json({ error: 'context7CompatibleLibraryID is required' });
  }
  
  try {
    // Récupération directe via l'API Context7
    const docs = await fetchLibraryDocumentation(context7CompatibleLibraryID, { 
      topic, 
      tokens: Math.max(tokens, DEFAULT_TOKENS) // S'assurer d'avoir au moins le minimum de tokens
    });
    
    if (!docs) {
      return res.status(404).json({ error: 'Documentation not found' });
    }
    
    // Retourner la documentation selon le schéma OpenAPI
    return res.json({ documentation: docs });
  } catch (error) {
    console.error('Error fetching library docs:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Page d'accueil simple
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Context7 MCP HTTP API</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; color: #333; }
          h1 { color: #2563eb; }
          code { background: #f1f5f9; padding: 2px 4px; border-radius: 4px; font-size: 0.9em; }
          .endpoint { background: #f8fafc; border-left: 4px solid #2563eb; padding: 12px; margin: 16px 0; border-radius: 4px; }
          a { color: #2563eb; text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <h1>Context7 MCP HTTP API</h1>
        <p>API HTTP pour interagir avec Context7 MCP (Upstash). Permet de résoudre des IDs de librairies et d'obtenir la documentation associée.</p>
        
        <h2>Endpoints disponibles :</h2>
        
        <div class="endpoint">
          <h3>POST /resolve-library-id</h3>
          <p>Résout l'ID context7 d'une librairie</p>
          <code>{ "libraryName": "nom_librairie" }</code>
        </div>
        
        <div class="endpoint">
          <h3>POST /get-library-docs</h3>
          <p>Récupère la doc d'une librairie</p>
          <code>{ "context7CompatibleLibraryID": "...", "topic": "...", "tokens": ... }</code>
        </div>
        
        <div class="endpoint">
          <h3>POST /restart-context7</h3>
          <p>Redémarre le process MCP Context7</p>
        </div>
        
        <div class="endpoint">
          <h3>GET /healthz</h3>
          <p>Vérifie que le serveur tourne</p>
        </div>
        
        <p>Documentation OpenAPI disponible à : <a href="/.well-known/openapi.yaml">/.well-known/openapi.yaml</a></p>
      </body>
    </html>
  `);
});

app.get('/healthz', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`✅ Context7 HTTP server running at http://localhost:${port}`);
});
