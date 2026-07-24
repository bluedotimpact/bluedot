import {
  afterEach, beforeEach, describe, expect, test, vi,
} from 'vitest';
import { sendEmailChangeVerification, updateCustomerIoEmail } from './customerio';
import env from './env';

vi.mock('./env', () => ({
  default: {
    APP_NAME: 'test-app',
    ALERTS_SLACK_BOT_TOKEN: 'fake-token',
    ALERTS_SLACK_CHANNEL_ID: 'fake-channel',
    CIO_APP_API_KEY: 'fake-app-key',
    CIO_TRACK_API_KEY: 'fake-track-key',
  },
}));

/**
 * In-memory model of the customer.io EU workspace, matching the (partly undocumented)
 * semantics we verified against production:
 *  - profiles are resolved by `id` or `email` identifier; email resolution is case-insensitive;
 *  - an id-keyed identify carrying an email owned by an email-only profile CLAIMS that profile
 *    in place (same cio_id, id attached) rather than creating a duplicate;
 *  - an identify whose email is owned by a DIFFERENT profile silently drops the email update
 *    (no error, other attributes still apply) — which is why verify-after-write is mandatory;
 *  - there is no merge API on api-eu; conflicts are surfaced as errors for manual resolution.
 *
 * These semantics were validated against the real production workspace with a live-fire
 * model-based test, which is preserved on the `wh-2810-cio-livetest-2026-07-archive` git branch,
 * file `apps/website/src/lib/api/customerio.prod.test.ts`.
 */
type FakeProfile = { cio_id: string; id?: string; email: string };

type FakeCio = {
  profiles: FakeProfile[];
  applyWrites: boolean;
  identifyCalls: { id: string; email: string }[];
};

const makeFakeCio = (profiles: FakeProfile[], { applyWrites = true }: { applyWrites?: boolean } = {}): FakeCio => ({
  profiles,
  applyWrites,
  identifyCalls: [],
});

const applyIdentify = (cio: FakeCio, id: string, email: string) => {
  const owner = cio.profiles.find((p) => p.email === email);
  const mine = cio.profiles.find((p) => p.id === id);
  if (owner && owner !== mine) {
    if (!owner.id && !mine) {
      owner.id = id;
      return;
    }

    return;
  }

  if (mine) {
    mine.email = email;
    return;
  }

  cio.profiles.push({ cio_id: `cio-${id}`, id, email });
};

const jsonResponse = (status: number, body: unknown) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
  text: async () => JSON.stringify(body),
}) as unknown as Response;

const installFakeCio = (cio: FakeCio) => {
  const fetchMock = vi.fn(async (input: unknown, init?: { method?: string; body?: string }) => {
    const url = new URL(String(input));
    const method = init?.method ?? 'GET';

    if (url.host === 'api-eu.customer.io') {
      if (url.pathname === '/v1/customers') {
        const email = url.searchParams.get('email');
        const results = cio.profiles
          .filter((p) => p.email === email)
          .map((p) => ({ cio_id: p.cio_id, id: p.id, email: p.email }));
        return jsonResponse(200, { results });
      }

      const attributesMatch = /^\/v1\/customers\/([^/]+)\/attributes$/.exec(url.pathname);
      if (attributesMatch && url.searchParams.get('id_type') === 'id') {
        const profile = cio.profiles.find((p) => p.id === decodeURIComponent(attributesMatch[1]!));
        if (!profile) return jsonResponse(404, { meta: { error: 'not found' } });
        return jsonResponse(200, {
          customer: {
            identifiers: { cio_id: profile.cio_id, id: profile.id, email: profile.email },
            attributes: { email: profile.email },
          },
        });
      }
    }

    if (url.host === 'track-eu.customer.io') {
      if (url.pathname === '/api/v2/batch' && method === 'POST') {
        const body = JSON.parse(init?.body ?? '{}') as { batch: { identifiers: { id: string }; attributes: { email: string } }[] };
        const entry = body.batch[0]!;
        cio.identifyCalls.push({ id: entry.identifiers.id, email: entry.attributes.email });
        if (cio.applyWrites) applyIdentify(cio, entry.identifiers.id, entry.attributes.email);
        return jsonResponse(200, {});
      }
    }

    return jsonResponse(500, { error: `unexpected request: ${method} ${url.href}` });
  });

  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

const runToCompletion = async (promise: Promise<void>) => {
  const outcome: { settled: boolean; error?: Error } = { settled: false };
  promise.then(
    () => {
      outcome.settled = true;
    },
    (error: unknown) => {
      outcome.settled = true;
      outcome.error = error instanceof Error ? error : new Error(JSON.stringify(error));
    },
  );
  while (!outcome.settled) {
    // eslint-disable-next-line no-await-in-loop
    await vi.advanceTimersByTimeAsync(1000);
  }

  if (outcome.error) throw outcome.error;
};

describe('updateCustomerIoEmail', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  test('skips when neither an id profile nor an old-email profile exists', async () => {
    const cio = makeFakeCio([]);
    installFakeCio(cio);

    await runToCompletion(updateCustomerIoEmail({ userId: 'u1', oldEmail: 'old@example.com', newEmail: 'new@example.com' }));

    expect(cio.identifyCalls).toEqual([]);
  });

  test('throws without any request when the API keys are not configured', async () => {
    const cio = makeFakeCio([]);
    const fetchMock = installFakeCio(cio);
    const mutableEnv = env as { CIO_APP_API_KEY?: string };
    mutableEnv.CIO_APP_API_KEY = undefined;

    try {
      await expect(runToCompletion(updateCustomerIoEmail({ userId: 'u1', oldEmail: 'old@example.com', newEmail: 'new@example.com' })))
        .rejects.toThrow('not configured');
    } finally {
      mutableEnv.CIO_APP_API_KEY = 'fake-app-key';
    }

    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('claims an email-only old-email profile and renames it', async () => {
    const cio = makeFakeCio([{ cio_id: 'c1', email: 'old@example.com' }]);
    installFakeCio(cio);

    await runToCompletion(updateCustomerIoEmail({ userId: 'u1', oldEmail: 'old@example.com', newEmail: 'new@example.com' }));

    expect(cio.identifyCalls).toEqual([
      { id: 'u1', email: 'old@example.com' },
      { id: 'u1', email: 'new@example.com' },
    ]);
    expect(cio.profiles).toEqual([{ cio_id: 'c1', id: 'u1', email: 'new@example.com' }]);
  });

  test('normalizes emails before use', async () => {
    const cio = makeFakeCio([{ cio_id: 'c1', email: 'old@example.com' }]);
    installFakeCio(cio);

    await runToCompletion(updateCustomerIoEmail({ userId: 'u1', oldEmail: '  Old@Example.COM ', newEmail: ' New@Example.com' }));

    expect(cio.identifyCalls).toEqual([
      { id: 'u1', email: 'old@example.com' },
      { id: 'u1', email: 'new@example.com' },
    ]);
    expect(cio.profiles[0]!.email).toBe('new@example.com');
  });

  test('renames an existing id profile even when its email no longer matches the old email', async () => {
    const cio = makeFakeCio([{ cio_id: 'c1', id: 'u1', email: 'stale@example.com' }]);
    installFakeCio(cio);

    await runToCompletion(updateCustomerIoEmail({ userId: 'u1', oldEmail: 'old@example.com', newEmail: 'new@example.com' }));

    expect(cio.identifyCalls).toEqual([{ id: 'u1', email: 'new@example.com' }]);
    expect(cio.profiles).toEqual([{ cio_id: 'c1', id: 'u1', email: 'new@example.com' }]);
  });

  test('does nothing when the id profile already has the new email', async () => {
    const cio = makeFakeCio([{ cio_id: 'c1', id: 'u1', email: 'new@example.com' }]);
    installFakeCio(cio);

    await runToCompletion(updateCustomerIoEmail({ userId: 'u1', oldEmail: 'old@example.com', newEmail: 'new@example.com' }));

    expect(cio.identifyCalls).toEqual([]);
  });

  test('refuses to claim an old-email profile owned by a different user id', async () => {
    const cio = makeFakeCio([{ cio_id: 'c1', id: 'u2', email: 'old@example.com' }]);
    installFakeCio(cio);

    await expect(runToCompletion(updateCustomerIoEmail({ userId: 'u1', oldEmail: 'old@example.com', newEmail: 'new@example.com' })))
      .rejects.toThrow('different user id (u2)');

    expect(cio.identifyCalls).toEqual([]);
  });

  test('refuses to claim when multiple profiles own the old email', async () => {
    const cio = makeFakeCio([
      { cio_id: 'c1', email: 'old@example.com' },
      { cio_id: 'c2', email: 'old@example.com' },
    ]);
    installFakeCio(cio);

    await expect(runToCompletion(updateCustomerIoEmail({ userId: 'u1', oldEmail: 'old@example.com', newEmail: 'new@example.com' })))
      .rejects.toThrow('multiple customer.io profiles own the old email');

    expect(cio.identifyCalls).toEqual([]);
  });

  test('throws without renaming when the claim never becomes visible', async () => {
    const cio = makeFakeCio([{ cio_id: 'c1', email: 'old@example.com' }], { applyWrites: false });
    installFakeCio(cio);

    await expect(runToCompletion(updateCustomerIoEmail({ userId: 'u1', oldEmail: 'old@example.com', newEmail: 'new@example.com' })))
      .rejects.toThrow('claiming the old-email profile did not complete');

    expect(cio.identifyCalls).toEqual([{ id: 'u1', email: 'old@example.com' }]);
  });

  test('throws without deleting anything when another profile owns the new email', async () => {
    const cio = makeFakeCio([
      { cio_id: 'c1', id: 'u1', email: 'old@example.com' },
      { cio_id: 'c2', email: 'new@example.com' },
    ]);
    installFakeCio(cio);

    await expect(runToCompletion(updateCustomerIoEmail({ userId: 'u1', oldEmail: 'old@example.com', newEmail: 'new@example.com' })))
      .rejects.toThrow('already owned by cio_c2');

    expect(cio.identifyCalls).toEqual([{ id: 'u1', email: 'new@example.com' }]);
    expect(cio.profiles.find((p) => p.cio_id === 'c1')!.email).toBe('old@example.com');
    expect(cio.profiles).toHaveLength(2);
  });

  test('names the owning user id when the conflicting profile carries one', async () => {
    const cio = makeFakeCio([
      { cio_id: 'c1', id: 'u1', email: 'old@example.com' },
      { cio_id: 'c2', id: 'u2', email: 'new@example.com' },
    ]);
    installFakeCio(cio);

    await expect(runToCompletion(updateCustomerIoEmail({ userId: 'u1', oldEmail: 'old@example.com', newEmail: 'new@example.com' })))
      .rejects.toThrow('already owned by cio_c2 (user id u2)');

    expect(cio.profiles).toHaveLength(2);
  });

  test('throws when the rename never verifies and no conflicting profile exists', async () => {
    const cio = makeFakeCio([{ cio_id: 'c1', id: 'u1', email: 'old@example.com' }], { applyWrites: false });
    installFakeCio(cio);

    await expect(runToCompletion(updateCustomerIoEmail({ userId: 'u1', oldEmail: 'old@example.com', newEmail: 'new@example.com' })))
      .rejects.toThrow('no conflicting profile was found');

    expect(cio.identifyCalls).toEqual([{ id: 'u1', email: 'new@example.com' }]);
  });

  test('succeeds without throwing when the rename lands late, after verify polling gave up', async () => {
    const cio = makeFakeCio([{ cio_id: 'c1', id: 'u1', email: 'old@example.com' }], { applyWrites: false });
    const fetchMock = installFakeCio(cio);
    const base = fetchMock.getMockImplementation()!;
    let attributesCalls = 0;
    fetchMock.mockImplementation(async (input, init) => {
      const result = await base(input, init);
      if (String(input).includes('/attributes')) {
        attributesCalls += 1;
        if (attributesCalls === 7) cio.profiles[0]!.email = 'new@example.com';
      }

      return result;
    });

    await runToCompletion(updateCustomerIoEmail({ userId: 'u1', oldEmail: 'old@example.com', newEmail: 'new@example.com' }));

    expect(cio.profiles).toEqual([{ cio_id: 'c1', id: 'u1', email: 'new@example.com' }]);
  });
});

describe('sendEmailChangeVerification', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('sends an inline transactional email to the new address, keyed to the old-email profile', async () => {
    const fetchMock = vi.fn(async () => jsonResponse(200, { delivery_id: 'd1' }));
    vi.stubGlobal('fetch', fetchMock);

    await sendEmailChangeVerification({ oldEmail: '  Old@Example.COM ', newEmail: ' New@Example.com ', confirmUrl: 'http://localhost:8000/account/confirm-email-change?token=abc' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]! as unknown as [string, { method: string; body: string }];
    expect(url).toBe('https://api-eu.customer.io/v1/send/email');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body) as { to: string; identifiers: { email: string }; send_to_unsubscribed: boolean; body: string; subject: string };
    expect(body.to).toBe('new@example.com');
    expect(body.identifiers).toEqual({ email: 'old@example.com' });
    expect(body.send_to_unsubscribed).toBe(true);
    expect(body.body).toContain('http://localhost:8000/account/confirm-email-change?token=abc');
    expect(body.subject).toBeTruthy();
  });

  test('throws when the send fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(400, { meta: { error: 'bad' } })));

    await expect(sendEmailChangeVerification({ oldEmail: 'old@example.com', newEmail: 'new@example.com', confirmUrl: 'https://bluedot.org/x' }))
      .rejects.toThrow('HTTP 400');
  });

  test('throws when the App API key is not configured', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const mutableEnv = env as { CIO_APP_API_KEY?: string };
    mutableEnv.CIO_APP_API_KEY = undefined;

    try {
      await expect(sendEmailChangeVerification({ oldEmail: 'old@example.com', newEmail: 'new@example.com', confirmUrl: 'https://bluedot.org/x' }))
        .rejects.toThrow('not configured');
    } finally {
      mutableEnv.CIO_APP_API_KEY = 'fake-app-key';
    }

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
