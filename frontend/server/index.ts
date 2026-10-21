import { createReadStream, realpathSync, statSync } from 'node:fs';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { extname, join, sep } from 'node:path';
import { handleLoanApi } from '../src/mocks/loansApi';

const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';
const MAX_BODY_BYTES = 1024 * 1024;
const DIST = join(process.cwd(), 'dist');

const CONTENT_TYPES: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
};

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

/** Reads the request body, stopping once it passes 1 MB. */
function readBody(req: IncomingMessage): Promise<{ body: string } | { tooLarge: true }> {
  const declared = Number(req.headers['content-length']);
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) return Promise.resolve({ tooLarge: true });

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let received = 0;
    let settled = false;
    req.on('data', (chunk: Buffer | string) => {
      if (settled) return;
      const buf = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
      received += buf.length;
      if (received > MAX_BODY_BYTES) {
        settled = true;
        req.pause();
        resolve({ tooLarge: true });
        return;
      }
      chunks.push(buf);
    });
    req.on('end', () => {
      if (settled) return;
      settled = true;
      resolve({ body: Buffer.concat(chunks).toString('utf8') });
    });
    req.on('error', (err) => {
      if (settled) return;
      settled = true;
      reject(err);
    });
  });
}

/** A file inside `dist`, or null when the path is missing or escapes the directory. */
function fileInDist(pathname: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (decoded.includes('\0')) return null;

  let root: string;
  try {
    root = realpathSync(DIST);
  } catch {
    return null;
  }

  const candidate = join(root, decoded);
  const rootPrefix = root.endsWith(sep) ? root : `${root}${sep}`;
  if (candidate !== root && !candidate.startsWith(rootPrefix)) return null;

  try {
    if (!statSync(candidate).isFile()) return null;
    const real = realpathSync(candidate);
    if (real !== root && !real.startsWith(rootPrefix)) return null;
    return real;
  } catch {
    return null;
  }
}

function serveStatic(res: ServerResponse, pathname: string): void {
  const file = fileInDist(pathname) ?? fileInDist('/index.html');
  if (!file) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }

  const type = CONTENT_TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream';
  const stream = createReadStream(file);
  stream.on('error', () => {
    if (!res.headersSent) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    res.destroy();
  });
  res.writeHead(200, { 'Content-Type': type });
  stream.pipe(res);
}

async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const pathname = new URL(req.url ?? '/', 'http://localhost').pathname;
  if (pathname.startsWith('/api/loans')) {
    const read = await readBody(req);
    if ('tooLarge' in read) {
      sendJson(res, 413, { error: 'Payload too large' });
      req.destroy();
      return;
    }
    try {
      const result = handleLoanApi(req.method ?? 'GET', pathname, read.body);
      sendJson(res, result.status, result.body);
    } catch {
      if (!res.headersSent) sendJson(res, 500, { error: 'Mock API failed' });
    }
    return;
  }
  serveStatic(res, pathname);
}

const server = createServer((req, res) => {
  void handle(req, res).catch((err: unknown) => {
    console.error(err);
    if (!res.headersSent) sendJson(res, 500, { error: 'Mock API failed' });
    else res.destroy();
  });
});

server.listen(PORT, HOST, () => {
  console.log(`http://${HOST}:${PORT}`);
});
