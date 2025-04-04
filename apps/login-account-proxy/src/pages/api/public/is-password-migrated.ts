import { z } from 'zod';
import axios from 'axios';
import createHttpError from 'http-errors';
import { slackAlert } from '@bluedot/ui';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import env from '../../../lib/api/env';

export type IsPasswordMigratedRequest = {
  email: string,
  secret: string,
};

export default makeApiRoute({
  requireAuth: false,
  requestBody: z.object({
    email: z.string().min(1),
    secret: z.string().min(1),
  }),
  responseBody: z.object({
    type: z.literal('success'),
    isMigrated: z.boolean(),
  }),
}, async (body) => {
  if (body.email === 'null') {
    throw new createHttpError.BadRequest('Email was null as string');
  }

  if (body.secret !== env.BUBBLE_SHARED_SECRET) {
    throw new createHttpError.Unauthorized('Invalid shared secret');
  }

  const clientCredentialsGrantParams = new URLSearchParams();
  clientCredentialsGrantParams.append('grant_type', 'client_credentials');
  clientCredentialsGrantParams.append('client_id', 'login-account-proxy');
  clientCredentialsGrantParams.append('client_secret', env.KEYCLOAK_CLIENT_SECRET);
  const accessToken = (await axios.post('https://login.bluedot.org/realms/master/protocol/openid-connect/token', clientCredentialsGrantParams)).data.access_token;

  const headers = {
    Authorization: `Bearer ${accessToken}`,
  };

  const potentialUsers = (await axios.get<{ id: string, email: string }[]>(`https://login.bluedot.org/admin/realms/customers/users?email=${encodeURIComponent(body.email)}&exact=true`, { headers })).data;

  if (potentialUsers.length > 1) {
    throw new Error(`Found more than one user for email: ${body.email}`);
  }

  if (potentialUsers.length === 0) {
    slackAlert(env, [`is-password-migrated: User not found in keycloak: ${body.email}`, 'This shouldn\'t happen because we thought we migrated all existing users over, and new users should be migrated they register. You should investigate how this user signed up for an account without a keycloak user.']);
    return { type: 'success' as const, isMigrated: false };
  }

  const credentials = (await axios.get<{ type: string }[]>(`https://login.bluedot.org/admin/realms/customers/users/${potentialUsers[0]!.id}/credentials`, { headers })).data;

  return { type: 'success' as const, isMigrated: credentials.some((c) => c.type === 'password') };
});
