import express from 'express';
import { spawn } from 'child_process';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

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


let context7;

function startContext7() {
  context7 = spawn('npx', ['-y', '@upstash/context7-mcp@latest'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  context7.stdout.setEncoding('utf8');
  context7.stderr.setEncoding('utf8');
  context7.on('error', (err) => {
    console.error('❌ MCP process error:', err);
  });
  context7.on('close', (code) => {
    console.log(`⚠️ MCP process exited with code ${code}`);
    context7 = null;
  });
}

startContext7();

function sendCommandToContext7(command) {
  return new Promise((resolve, reject) => {
    if (!context7) {
      return reject(new Error('MCP server not running'));
    }
    let output = '';
    let errorOutput = '';
    const onData = (data) => {
      output += data;
      if (output.includes('\n')) {
        try {
          const jsonResponse = JSON.parse(output.trim());
          cleanup();
          resolve(jsonResponse);
        } catch (e) {
          cleanup();
          reject(new Error('Invalid JSON response: ' + output));
        }
      }
    };
    const onError = (data) => {
      errorOutput += data;
    };
    const onExit = () => {
      cleanup();
      reject(new Error('MCP process exited unexpectedly'));
    };
    function cleanup() {
      context7.stdout.removeListener('data', onData);
      context7.stderr.removeListener('data', onError);
      context7.removeListener('exit', onExit);
    }
    context7.stdout.on('data', onData);
    context7.stderr.on('data', onError);
    context7.on('exit', onExit);
    context7.stdin.write(JSON.stringify(command) + '\n');
  });
}

app.post('/resolve-library-id', async (req, res) => {
  const { libraryName } = req.body;
  if (!libraryName) {
    return res.status(400).json({ error: 'libraryName is required' });
  }
  try {
    const response = await sendCommandToContext7({
      method: 'resolve-library-id',
      params: { libraryName }
    });
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/get-library-docs', async (req, res) => {
  const { context7CompatibleLibraryID, topic, tokens } = req.body;
  if (!context7CompatibleLibraryID) {
    return res.status(400).json({ error: 'context7CompatibleLibraryID is required' });
  }
  try {
    const response = await sendCommandToContext7({
      method: 'get-library-docs',
      params: {
        context7CompatibleLibraryID,
        topic,
        tokens
      }
    });
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/restart-context7', (req, res) => {
  if (context7) {
    context7.kill();
  }
  startContext7();
  res.json({ message: 'Context7 MCP server restarted' });
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
