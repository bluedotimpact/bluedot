import {
  afterEach, beforeEach, expect, test, vi,
} from 'vitest';

const { invite, decline, lock } = vi.hoisted(() => ({ invite: vi.fn(), decline: vi.fn(), lock: vi.fn() }));
vi.mock('./airtable', () => ({ inviteForReal: invite, declineForReal: decline }));
vi.mock('./decisionLock', () => ({ withDecisionLock: lock }));
import { recordDecision } from './index';
import { samplePeople } from './preview';

beforeEach(() => {
  vi.clearAllMocks();
  delete (globalThis as typeof globalThis & { scoutPreviewState?: unknown }).scoutPreviewState;
  invite.mockResolvedValue({ ok: true });
  decline.mockResolvedValue({ ok: true });
  lock.mockImplementation(async (_id: string, fn: () => Promise<unknown>) => fn());
});
afterEach(() => vi.unstubAllEnvs());

test('serializes real decisions through the database lock, including declines', async () => {
  vi.stubEnv('NEXT_PUBLIC_LOCAL_PREVIEW', 'false');
  await recordDecision('recScoutSample001', 'invite');
  await recordDecision('recScoutSample002', 'decline');
  expect(lock.mock.calls.map(([id]) => id)).toEqual(['recScoutSample001', 'recScoutSample002']);
  expect(invite).toHaveBeenCalledWith('recScoutSample001');
  expect(decline).toHaveBeenCalledWith('recScoutSample002');
});

test('sample decisions stay isolated and reject repeated decisions', async () => {
  vi.stubEnv('NODE_ENV', 'development');
  vi.stubEnv('NEXT_PUBLIC_LOCAL_PREVIEW', 'true');
  const { id } = (samplePeople[0]!);
  expect(await recordDecision(id, 'invite')).toEqual({ ok: true });
  expect(await recordDecision(id, 'decline')).toMatchObject({ ok: false });
  expect(invite).not.toHaveBeenCalled();
  expect(decline).not.toHaveBeenCalled();
  expect(lock).not.toHaveBeenCalled();
});

test('production cannot activate sample decisions with a preview flag', async () => {
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('NEXT_PUBLIC_LOCAL_PREVIEW', 'true');
  await recordDecision('recScoutSample001', 'invite');
  expect(lock).toHaveBeenCalledOnce();
  expect(invite).toHaveBeenCalledOnce();
});
