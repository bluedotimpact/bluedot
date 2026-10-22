import {
  beforeEach, expect, test, vi,
} from 'vitest';

const { invite, decline } = vi.hoisted(() => ({ invite: vi.fn(), decline: vi.fn() }));
vi.mock('./airtable', () => ({ inviteForReal: invite, declineForReal: decline }));
import { recordDecision } from './index';

beforeEach(() => {
  vi.clearAllMocks();
  invite.mockResolvedValue({ ok: true });
  decline.mockResolvedValue({ ok: true });
});

test('routes each decision to the matching Airtable write', async () => {
  await recordDecision('recScoutSample001', 'invite');
  await recordDecision('recScoutSample002', 'decline', 'Sharp on the mechanisms, worth a call.');
  expect(invite).toHaveBeenCalledWith('recScoutSample001', undefined);
  expect(decline).toHaveBeenCalledWith('recScoutSample002', 'Sharp on the mechanisms, worth a call.');
  expect(invite).toHaveBeenCalledOnce();
  expect(decline).toHaveBeenCalledOnce();
});
