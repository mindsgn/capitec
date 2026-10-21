import { handleLoanApi } from '../src/mocks/loansApi';

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

const MAX_BODY_BYTES = 1024 * 1024;

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

/** Serves `/api/loans` and leaves pages and static files to the asset binding. */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/loans')) return env.ASSETS.fetch(request);

    const declared = Number(request.headers.get('content-length'));
    if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) return json(413, { error: 'Payload too large' });

    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) return json(413, { error: 'Payload too large' });

    try {
      const result = handleLoanApi(request.method, url.pathname, rawBody);
      return json(result.status, result.body);
    } catch {
      return json(500, { error: 'Mock API failed' });
    }
  },
};
