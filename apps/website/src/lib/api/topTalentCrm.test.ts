import {
  describe, expect, test, vi, beforeEach,
} from 'vitest';
import {
  assertBluedotStaff, findByLinkedIn, resolveOwnerByEmail, createPerson, updatePerson, CRM_DATABASE_ID,
} from './topTalentCrm';

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as Response;
}

describe('assertBluedotStaff', () => {
  test('allows bluedot.org emails (case-insensitive)', () => {
    expect(() => assertBluedotStaff('dewi@bluedot.org')).not.toThrow();
    expect(() => assertBluedotStaff('Dewi@BlueDot.org')).not.toThrow();
  });

  test('rejects non-bluedot emails', () => {
    expect(() => assertBluedotStaff('someone@gmail.com')).toThrow(/restricted to BlueDot staff/);
    // Guard against a naive substring check being fooled by a lookalike domain.
    expect(() => assertBluedotStaff('attacker@bluedot.org.evil.com')).toThrow();
  });
});

describe('findByLinkedIn', () => {
  beforeEach(() => vi.restoreAllMocks());

  test('returns null when there is no match', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(jsonResponse({ results: [] }));
    expect(await findByLinkedIn('t', 'https://www.linkedin.com/in/x/')).toBeNull();
  });

  test('maps a match to id/url/name/status/scores', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(jsonResponse({
      results: [{
        id: 'p1',
        url: 'https://notion.so/p1',
        properties: {
          Name: { title: [{ plain_text: 'Ada Lovelace' }] },
          Status: { status: { name: 'Promising' } },
          Expertise: { number: 5 },
          Agency: { number: 3 },
        },
      }],
    }));
    const match = await findByLinkedIn('t', 'https://www.linkedin.com/in/ada/');
    expect(match).toEqual({
      id: 'p1',
      url: 'https://notion.so/p1',
      name: 'Ada Lovelace',
      status: 'Promising',
      scores: { Expertise: 5, Agency: 3 },
    });
  });
});

describe('resolveOwnerByEmail', () => {
  beforeEach(() => vi.restoreAllMocks());

  test('matches a person by email, case-insensitively', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(jsonResponse({
      results: [
        { id: 'bot', type: 'bot' },
        { id: 'u1', type: 'person', person: { email: 'Dewi@bluedot.org' } },
      ],
      has_more: false,
    }));
    expect(await resolveOwnerByEmail('t', 'dewi@bluedot.org')).toBe('u1');
  });

  test('returns null when no person has that email', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(jsonResponse({
      results: [{ id: 'u1', type: 'person', person: { email: 'other@bluedot.org' } }],
      has_more: false,
    }));
    expect(await resolveOwnerByEmail('t', 'dewi@bluedot.org')).toBeNull();
  });
});

describe('createPerson', () => {
  beforeEach(() => vi.restoreAllMocks());

  test('sends Owner, scores, and a dated note bullet', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(jsonResponse({ id: 'new', url: 'https://notion.so/new' }));
    const result = await createPerson('t', {
      name: 'Ada Lovelace',
      linkedInUrl: 'https://www.linkedin.com/in/ada/',
      status: 'Promising',
      scores: { Expertise: 5 },
      notes: 'Strong candidate',
      localDate: '2026-06-29',
      ownerUserId: 'owner-1',
    });
    expect(result).toEqual({ id: 'new', url: 'https://notion.so/new' });

    const body = JSON.parse((fetchSpy.mock.calls[0]![1]!).body as string);
    expect(body.properties.Owner.people[0].id).toBe('owner-1');
    expect(body.properties.Expertise).toEqual({ number: 5 });
    expect(body.properties.Status.status.name).toBe('Promising');
    // Note rendered as a bullet with a @today date mention + the note text.
    const rich = body.children[0].bulleted_list_item.rich_text;
    expect(rich[0].mention.date.start).toBe('2026-06-29');
    expect(rich[1].text.content).toBe(': Strong candidate');
  });
});

describe('updatePerson', () => {
  beforeEach(() => vi.restoreAllMocks());

  test('rejects a page that is not in the CRM database', async () => {
    // First call is the parent-check GET, returning a page in some OTHER database.
    vi.spyOn(global, 'fetch').mockResolvedValue(jsonResponse({ parent: { database_id: 'deadbeef-0000-0000-0000-000000000000' } }));
    await expect(updatePerson('t', 'foreign-page', { status: 'Promising' })).rejects.toThrow(/not in the Top Talent CRM/);
  });

  test('allows a page whose parent is the CRM database', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch')
      // 1) parent-check GET -> page is in the CRM db (hyphenated form)
      .mockResolvedValueOnce(jsonResponse({ parent: { database_id: '343f8e69-0353-8022-acfa-f81252fed117' } }))
      // 2) properties PATCH
      .mockResolvedValueOnce(jsonResponse({}));
    expect(CRM_DATABASE_ID).toBe('343f8e6903538022acfaf81252fed117');
    const result = await updatePerson('t', 'crm-page', { status: 'Evaluating' });
    expect(result).toEqual({ id: 'crm-page' });
    // No note given, so only the parent-check GET + the properties PATCH ran.
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
