import { TRPCError } from '@trpc/server';
import { describe, expect, test } from 'vitest';
import { appRouter } from './routers/_app';
import { AuthenticationRequiredError } from './trpc';

const loggedOutCaller = appRouter.createCaller({ auth: null, impersonation: null, userAgent: undefined });

describe('AuthenticationRequiredError', () => {
  test('is what a protected procedure throws for a caller with no session', async () => {
    await expect(loggedOutCaller.admin.canImpersonate()).rejects.toBeInstanceOf(AuthenticationRequiredError);
  });

  // The API handler suppresses this error when the request had no authorization header, so anything
  // else that returns UNAUTHORIZED must stay distinguishable from it or its 401s stop being logged.
  test('is not used by public procedures that reject a bad token from their input', async () => {
    const error: unknown = await loggedOutCaller.subscriptionPreferences
      .getPreferences({ cid: 'cus_1', token: 'not-the-real-hmac' })
      .catch((rejection: unknown) => rejection);

    expect(error).toBeInstanceOf(TRPCError);
    expect(error).not.toBeInstanceOf(AuthenticationRequiredError);
    expect(error).toMatchObject({ code: 'UNAUTHORIZED' });
  });
});
