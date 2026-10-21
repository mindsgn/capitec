import type { Connect, Plugin } from 'vite';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { handleLoanApi } from './src/mocks/loansApi';

/** Serves the loan mock on the Vite dev server. Production uses `server/index.ts`. */
function loansApiPlugin(): Plugin {
  const middleware: Connect.NextHandleFunction = (req, res, next) => {
    const urlPath = (req.url ?? '').split('?')[0] ?? '';
    if (!urlPath.startsWith('/api/loans')) {
      next();
      return;
    }
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer | string) => {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    });
    req.on('end', () => {
      try {
        const result = handleLoanApi(req.method ?? 'GET', urlPath, Buffer.concat(chunks).toString('utf8'));
        res.statusCode = result.status;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result.body));
      } catch {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Mock API failed' }));
      }
    });
  };
  return {
    name: 'loans-mock-api',
    configureServer(server) { server.middlewares.use(middleware); },
    configurePreviewServer(server) { server.middlewares.use(middleware); },
  };
}

export default defineConfig({
  plugins: [react(), loansApiPlugin()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  server: { port: 5173 },
});
