import {
  beforeEach, describe, expect, test, vi,
} from 'vitest';

const mockDb = vi.hoisted(() => {
  const state = { airtableAttendees: [] as string[], resolveUpdate: null as null | (() => void) };
  return {
    state,
    ensureReplicated: vi.fn(async () => ({ id: 'rec', attendees: [...state.airtableAttendees] })),
    update: vi.fn(async (_table: unknown, { attendees }: { id: string; attendees: string[] }) => {
      await new Promise<void>((resolve) => {
        state.resolveUpdate = resolve;
      });
      state.airtableAttendees = [...attendees];
    }),
  };
});

vi.mock('../../../lib/api/db', () => ({ default: mockDb }));

// Each test uses its own discussion id because the queue state is module-level
const { recordAttendance } = await import('../../../pages/api/public/record-attendance');

const flushMicrotasks = () => new Promise((resolve) => {
  setTimeout(resolve, 0);
});

// Lets the in-flight Airtable write finish
const finishUpdate = async () => {
  await flushMicrotasks();
  mockDb.state.resolveUpdate?.();
  mockDb.state.resolveUpdate = null;
  await flushMicrotasks();
};

describe('recordAttendance', () => {
  beforeEach(() => {
    mockDb.state.airtableAttendees = [];
    mockDb.ensureReplicated.mockClear();
    mockDb.update.mockClear();
  });

  test('combines concurrent requests into one write', async () => {
    const done = Promise.all([
      recordAttendance({ groupDiscussionId: 'recOne', participantId: 'recA' }),
      recordAttendance({ groupDiscussionId: 'recOne', participantId: 'recB' }),
    ]);
    await finishUpdate();
    await done;

    expect(mockDb.update).toHaveBeenCalledTimes(1);
    expect(mockDb.update.mock.calls[0]?.[1]).toEqual({ id: 'recOne', attendees: ['recA', 'recB'] });
  });

  test('a request arriving mid-write goes into the next write and resolves after it', async () => {
    const first = recordAttendance({ groupDiscussionId: 'recTwo', participantId: 'recA' });
    await flushMicrotasks();
    const second = recordAttendance({ groupDiscussionId: 'recTwo', participantId: 'recB' });
    let secondResolved = false;
    second.then(() => {
      secondResolved = true;
    });

    await finishUpdate();
    await first;
    expect(secondResolved).toBe(false);

    await finishUpdate();
    await second;
    expect(mockDb.update).toHaveBeenCalledTimes(2);
    expect(mockDb.update.mock.calls[1]?.[1]).toEqual({ id: 'recTwo', attendees: ['recA', 'recB'] });
  });

  test('keeps attendees that are in Airtable but not yet in Postgres, and skips the write when nothing is new', async () => {
    mockDb.state.airtableAttendees = ['recOps'];
    const done = recordAttendance({ groupDiscussionId: 'recThree', participantId: 'recA' });
    await finishUpdate();
    await done;
    expect(mockDb.update.mock.calls[0]?.[1]).toEqual({ id: 'recThree', attendees: ['recOps', 'recA'] });

    await recordAttendance({ groupDiscussionId: 'recThree', participantId: 'recA' });
    expect(mockDb.update).toHaveBeenCalledTimes(1);
  });
});
