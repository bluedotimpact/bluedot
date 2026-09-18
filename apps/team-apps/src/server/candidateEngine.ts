import { TRPCError } from '@trpc/server';
import { isLocalPreview } from '../lib/preview';

type EngineInput = { searchId?: string; route: string; body?: unknown };

export const requestCandidateEngine = async <T>({ searchId = '', route, body }: EngineInput): Promise<T> => {
  const configured = process.env.CANDIDATE_SOURCING_URL;
  if (!configured) throw new TRPCError({ code: 'SERVICE_UNAVAILABLE', message: 'Candidate sourcing is not connected. Start its local assessment engine and configure CANDIDATE_SOURCING_URL.' });
  const origin = new URL(configured);
  if (origin.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(origin.hostname) || origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash) {
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'The candidate engine must use a private localhost address.' });
  }

  const prefix = searchId ? `/search/${encodeURIComponent(searchId)}` : '';
  const request = async (path: string, init?: RequestInit) => {
    try {
      return await fetch(new URL(path, origin), { ...init, cache: 'no-store', signal: AbortSignal.timeout(240_000) });
    } catch {
      throw new TRPCError({ code: 'SERVICE_UNAVAILABLE', message: 'The assessment engine is unavailable. Your saved work is kept. Start the engine, then retry.' });
    }
  };

  const read = async (response: Response) => {
    const result = await response.json();
    if (!response.ok) {
      const code = ({
        400: 'BAD_REQUEST', 403: 'CONFLICT', 404: 'NOT_FOUND', 409: 'CONFLICT', 502: 'BAD_GATEWAY',
      } as const)[response.status as 400 | 403 | 404 | 409 | 502] ?? 'INTERNAL_SERVER_ERROR';
      throw new TRPCError({ code, message: typeof result.error === 'string' ? result.error : 'The assessment engine could not finish this request.' });
    }

    return result;
  };

  // A development preview identity must never reach the real candidate pool or Ashby.
  if (isLocalPreview()) {
    const health = await read(await request('/api/health'));
    if (health.synthetic !== true) throw new TRPCError({ code: 'FORBIDDEN', message: 'Sample-data mode requires the synthetic candidate engine.' });
  }

  let init: RequestInit | undefined;
  if (body !== undefined) {
    const catalog = await read(await request(`${prefix}/api/searches`));
    init = { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin.origin, 'X-Review-Token': catalog.token }, body: JSON.stringify(body) };
  }

  const result = await read(await request(`${prefix}/api/${route}`, init));
  // The engine's local session token belongs on the server, not in browser responses.
  if (result && typeof result === 'object' && !Array.isArray(result)) delete result.token;
  return result as T;
};
