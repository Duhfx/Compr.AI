// tests/local-server.js
// Servidor local para testar Vercel Functions sem necessidade de login

import { createServer } from 'http';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Carregar variáveis de ambiente do .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env.local');

try {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
  console.log('✅ Variáveis de ambiente carregadas\n');
} catch (error) {
  console.error('❌ Erro ao carregar .env.local:', error.message);
  process.exit(1);
}

const PORT = 3000;

const server = createServer(async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Roteamento das APIs
  if (req.url === '/api/suggest-items' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const requestBody = JSON.parse(body);

        // Importar e executar a função
        const handler = (await import('../api/suggest-items.ts')).default;

        // Simular objetos VercelRequest e VercelResponse
        const mockReq = {
          method: 'POST',
          body: requestBody,
          headers: req.headers
        };

        const mockRes = {
          status: (code) => ({
            json: (data) => {
              res.writeHead(code, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(data));
            }
          }),
          json: (data) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data));
          }
        };

        await handler(mockReq, mockRes);
      } catch (error) {
        console.error('Erro ao processar requisição:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Internal server error',
          message: error.message
        }));
      }
    });
  } else if (req.url === '/api/normalize-item' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const requestBody = JSON.parse(body);

        const handler = (await import('../api/normalize-item.ts')).default;

        const mockReq = {
          method: 'POST',
          body: requestBody,
          headers: req.headers
        };

        const mockRes = {
          status: (code) => ({
            json: (data) => {
              res.writeHead(code, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(data));
            }
          }),
          json: (data) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data));
          }
        };

        await handler(mockReq, mockRes);
      } catch (error) {
        console.error('Erro ao processar requisição:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Internal server error',
          message: error.message
        }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Servidor de teste rodando em http://localhost:${PORT}`);
  console.log(`📍 Endpoints disponíveis:`);
  console.log(`   - POST http://localhost:${PORT}/api/suggest-items`);
  console.log(`   - POST http://localhost:${PORT}/api/normalize-item`);
  console.log(`\n⏳ Aguardando requisições...\n`);
});

// Tratamento de encerramento gracioso
process.on('SIGINT', () => {
  console.log('\n\n👋 Encerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor encerrado com sucesso');
    process.exit(0);
  });
});
