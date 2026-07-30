import { TRPCError } from '@trpc/server';
import { describe, expect, test } from 'vitest';
import { appRouter } from './routers/_app';
import { AuthenticationRequiredError } from './trpc';

const loggedOutCaller = appRouter.createCaller({ auth: null, impersonation: null, userAgent: undefined });

describe('AuthenticationRequiredError', () => {
  test('is what a protected procedure throws for a caller with no session', async () => {
    await expect(loggedOutCaller.admin.canImpersonate()).rejects.toBeInstanceOf(AuthenticationRequiredError);
  });

  // Tokenless requests throwing this error go unlogged; other UNAUTHORIZED errors must not.
  test('is not used by public procedures that reject a bad token from their input', async () => {
    const error: unknown = await loggedOutCaller.subscriptionPreferences
      .getPreferences({ cid: 'cus_1', token: 'not-the-real-hmac' })
      .catch((rejection: unknown) => rejection);

    expect(error).toBeInstanceOf(TRPCError);
    expect(error).not.toBeInstanceOf(AuthenticationRequiredError);
    expect(error).toMatchObject({ code: 'UNAUTHORIZED' });
  });
});
