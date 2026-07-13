import { courseRegistrationTable, userTable } from '@bluedot/db';
import { describe, expect, test } from 'vitest';
import { createCaller, setupTestDb, testDb } from '../../__tests__/dbTestUtils';
import env from '../../lib/api/env';

const TEST_TOKEN = 'test-token-secret';

setupTestDb();

const link = (input: { courseRegistrationId?: string; userId?: string; publicToken?: string }) => createCaller()
  .courseRegistrationLinking.link({ publicToken: TEST_TOKEN, ...input });

const getRegistration = (id: string) => testDb.getFirst(courseRegistrationTable, { filter: { id } });

describe('auth', () => {
  test('throws UNAUTHORIZED when the token is the wrong length', async () => {
    await expect(link({ courseRegistrationId: 'reg1', publicToken: 'wrong' }))
      .rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  test('throws UNAUTHORIZED for a same-length but different token', async () => {
    await expect(link({ courseRegistrationId: 'reg1', publicToken: 'X'.repeat(TEST_TOKEN.length) }))
      .rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  test('throws INTERNAL_SERVER_ERROR when the token is not configured', async () => {
    const mutableEnv = env as { CERTIFICATE_CREATION_TOKEN?: string };
    mutableEnv.CERTIFICATE_CREATION_TOKEN = undefined;
    try {
      await expect(link({ courseRegistrationId: 'reg1' }))
        .rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });
    } finally {
      mutableEnv.CERTIFICATE_CREATION_TOKEN = TEST_TOKEN;
    }
  });

  test('throws BAD_REQUEST when both courseRegistrationId and userId are provided', async () => {
    await expect(link({ courseRegistrationId: 'reg1', userId: 'user1' }))
      .rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  test('throws BAD_REQUEST when neither courseRegistrationId nor userId is provided', async () => {
    await expect(link({})).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });
});

describe('link by courseRegistrationId', () => {
  test('throws NOT_FOUND for an unknown course registration', async () => {
    await expect(link({ courseRegistrationId: 'missing' }))
      .rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  test('leaves an already-linked registration untouched', async () => {
    await testDb.insert(userTable, { id: 'user1', email: 'someone@example.com', name: 'Someone' });
    await testDb.insert(courseRegistrationTable, {
      id: 'reg1', email: 'someone@example.com', courseId: 'c1', userId: 'manually-set-user',
    });

    const result = await link({ courseRegistrationId: 'reg1' });

    expect(result).toEqual({ action: 'already-linked', userId: 'manually-set-user' });
    expect((await getRegistration('reg1'))?.userId).toBe('manually-set-user');
  });

  test('skips registrations without an email and does not create a user', async () => {
    await testDb.insert(courseRegistrationTable, { id: 'reg1', email: '', courseId: 'c1' });

    const result = await link({ courseRegistrationId: 'reg1' });

    expect(result).toEqual({ action: 'skipped-no-email' });
    expect((await getRegistration('reg1'))?.userId).toBeNull();
    expect(await testDb.pg.select().from(userTable.pg)).toHaveLength(0);
  });

  test('links to the existing user with a matching email', async () => {
    await testDb.insert(userTable, { id: 'user1', email: 'someone@example.com', name: 'Someone' });
    await testDb.insert(courseRegistrationTable, { id: 'reg1', email: 'someone@example.com', courseId: 'c1' });

    const result = await link({ courseRegistrationId: 'reg1' });

    expect(result).toEqual({ action: 'linked', userId: 'user1' });
    expect((await getRegistration('reg1'))?.userId).toBe('user1');
  });

  test('among duplicate users, links to the same row db.getFirst resolves (highest autoNumberId)', async () => {
    await testDb.insert(userTable, {
      id: 'user-old', email: 'dupe@example.com', name: 'Old', autoNumberId: 1,
    });
    await testDb.insert(userTable, {
      id: 'user-new', email: 'dupe@example.com', name: 'New', autoNumberId: 2,
    });
    await testDb.insert(courseRegistrationTable, { id: 'reg1', email: 'dupe@example.com', courseId: 'c1' });

    const result = await link({ courseRegistrationId: 'reg1' });

    const getFirstUser = await testDb.getFirst(userTable, { filter: { email: 'dupe@example.com' } });
    expect(getFirstUser?.id).toBe('user-new');
    expect(result).toEqual({ action: 'linked', userId: 'user-new' });
    expect((await getRegistration('reg1'))?.userId).toBe('user-new');
  });

  test('matches emails case-insensitively instead of creating a duplicate user', async () => {
    await testDb.insert(userTable, { id: 'user1', email: 'someone@example.com', name: 'Someone' });
    await testDb.insert(courseRegistrationTable, { id: 'reg1', email: 'Someone@Example.COM', courseId: 'c1' });

    const result = await link({ courseRegistrationId: 'reg1' });

    expect(result).toEqual({ action: 'linked', userId: 'user1' });
    expect(await testDb.pg.select().from(userTable.pg)).toHaveLength(1);
  });

  test('creates a user with the name built from first and last name when none matches', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'reg1', email: 'new@example.com', courseId: 'c1', firstName: 'Ada', lastName: 'Lovelace',
    });

    const result = await link({ courseRegistrationId: 'reg1' });

    expect(result.action).toBe('created-user-and-linked');
    const user = await testDb.getFirst(userTable, { filter: { email: 'new@example.com' } });
    expect(user).toMatchObject({ name: 'Ada Lovelace' });
    expect((await getRegistration('reg1'))?.userId).toBe(user?.id);
  });

  test('creates a user with a lowercased email so website lookups can resolve it', async () => {
    await testDb.insert(courseRegistrationTable, { id: 'reg1', email: 'John.Doe@Example.com', courseId: 'c1' });

    const result = await link({ courseRegistrationId: 'reg1' });

    expect(result.action).toBe('created-user-and-linked');
    const user = await testDb.getFirst(userTable, { filter: { email: 'john.doe@example.com' } });
    expect(user).not.toBeNull();
    expect((await getRegistration('reg1'))?.userId).toBe(user?.id);
  });

  test('creates a user without a name (not the email fallback) when the registration has no name', async () => {
    await testDb.insert(courseRegistrationTable, { id: 'reg1', email: 'new@example.com', courseId: 'c1' });

    const result = await link({ courseRegistrationId: 'reg1' });

    expect(result.action).toBe('created-user-and-linked');
    const user = await testDb.getFirst(userTable, { filter: { email: 'new@example.com' } });
    expect(user?.name).toBe('');
    expect((await getRegistration('reg1'))?.userId).toBe(user?.id);
  });
});

describe('link by userId', () => {
  test('throws NOT_FOUND for an unknown user', async () => {
    await expect(link({ userId: 'missing' })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  test('links all unlinked registrations matching the user email case-insensitively', async () => {
    await testDb.insert(userTable, { id: 'user1', email: 'someone@example.com', name: 'Someone' });
    await testDb.insert(courseRegistrationTable, { id: 'reg1', email: 'someone@example.com', courseId: 'c1' });
    await testDb.insert(courseRegistrationTable, { id: 'reg2', email: 'Someone@Example.COM', courseId: 'c2' });
    await testDb.insert(courseRegistrationTable, { id: 'reg3', email: 'other@example.com', courseId: 'c1' });

    const result = await link({ userId: 'user1' });

    expect(result).toEqual({ action: 'linked-user-registrations', userId: 'user1', linkedCount: 2 });
    expect((await getRegistration('reg1'))?.userId).toBe('user1');
    expect((await getRegistration('reg2'))?.userId).toBe('user1');
    expect((await getRegistration('reg3'))?.userId).toBeNull();
  });

  test('leaves already-linked registrations untouched', async () => {
    await testDb.insert(userTable, { id: 'user1', email: 'someone@example.com', name: 'Someone' });
    await testDb.insert(courseRegistrationTable, {
      id: 'reg1', email: 'someone@example.com', courseId: 'c1', userId: 'manually-set-user',
    });

    const result = await link({ userId: 'user1' });

    expect(result).toEqual({ action: 'linked-user-registrations', userId: 'user1', linkedCount: 0 });
    expect((await getRegistration('reg1'))?.userId).toBe('manually-set-user');
  });

  test('links to the canonical duplicate even when triggered for an older duplicate user', async () => {
    await testDb.insert(userTable, {
      id: 'user-old', email: 'dupe@example.com', name: 'Old', autoNumberId: 1,
    });
    await testDb.insert(userTable, {
      id: 'user-new', email: 'dupe@example.com', name: 'New', autoNumberId: 2,
    });
    await testDb.insert(courseRegistrationTable, { id: 'reg1', email: 'dupe@example.com', courseId: 'c1' });

    const result = await link({ userId: 'user-old' });

    expect(result).toEqual({ action: 'linked-user-registrations', userId: 'user-new', linkedCount: 1 });
    expect((await getRegistration('reg1'))?.userId).toBe('user-new');
  });

  test('skips users without an email instead of matching empty-email registrations', async () => {
    await testDb.insert(userTable, { id: 'user1', email: '', name: 'No Email' });
    await testDb.insert(courseRegistrationTable, { id: 'reg1', email: '', courseId: 'c1' });

    const result = await link({ userId: 'user1' });

    expect(result).toEqual({ action: 'skipped-no-email' });
    expect((await getRegistration('reg1'))?.userId).toBeNull();
  });

  test('never creates a user', async () => {
    await testDb.insert(userTable, { id: 'user1', email: 'someone@example.com', name: 'Someone' });

    await link({ userId: 'user1' });

    expect(await testDb.pg.select().from(userTable.pg)).toHaveLength(1);
  });
});
