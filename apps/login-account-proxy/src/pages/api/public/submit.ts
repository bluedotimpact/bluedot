import { z } from 'zod';
import axios from 'axios';
import createHttpError from 'http-errors';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import env from '../../../lib/api/env';
import { slackAlert } from '@bluedot/ui';

export type SubmitRequest = {
  oldEmail?: string,
  newEmail: string,
  password: string,
  secret: string,
};

export default makeApiRoute({
  requireAuth: false,
  requestBody: z.object({
    oldEmail: z.string().optional(),
    newEmail: z.string().min(1),
    password: z.string().min(1),
    secret: z.string().min(1),
  }),
  responseBody: z.object({
    type: z.literal('success'),
  }),
}, async (body) => {
  if (body.oldEmail === 'null') {
    throw new createHttpError.BadRequest('Old email was null as string');
  }
  if (body.newEmail === 'null') {
    throw new createHttpError.BadRequest('Email was null as string');
  }

  if (body.secret !== env.BUBBLE_SHARED_SECRET) {
    throw new createHttpError.Unauthorized('Invalid shared secret');
  }

  const isChangingEmail = body.oldEmail && body.oldEmail !== body.newEmail;

  const clientCredentialsGrantParams = new URLSearchParams();
  clientCredentialsGrantParams.append('grant_type', 'client_credentials');
  clientCredentialsGrantParams.append('client_id', 'login-account-proxy');
  clientCredentialsGrantParams.append('client_secret', env.KEYCLOAK_CLIENT_SECRET);
  const accessToken = (await axios.post('https://login.bluedot.org/realms/master/protocol/openid-connect/token', clientCredentialsGrantParams)).data.access_token;

  const headers = {
    Authorization: `Bearer ${accessToken}`,
  };

  const potentialUsers = (await axios.get<{ id: string, email: string }[]>(`https://login.bluedot.org/admin/realms/customers/users?email=${encodeURIComponent(body.oldEmail || body.newEmail)}&exact=true`, { headers })).data;

  if (potentialUsers.length > 1) {
    throw new Error(`Found more than one user for email: ${body.oldEmail || body.newEmail}`);
  }

  // No account exists, and we expect one to
  if (isChangingEmail && potentialUsers.length === 0) {
    const potentialNewUsers = (await axios.get<{ id: string, email: string }[]>(`https://login.bluedot.org/admin/realms/customers/users?email=${encodeURIComponent(body.newEmail)}&exact=true`, { headers })).data;

    if (potentialNewUsers.length === 0) {
      throw new createHttpError.BadRequest(`Tried to change email, but cannot find existing accounts in Keycloak for email ${body.oldEmail} or ${body.newEmail}`);
    }

    if (potentialNewUsers.length >= 1) {
      slackAlert(env, [`User tried to change email from ${body.oldEmail} to ${body.newEmail}, but only found account for new email. Ignoring this request, because this usually indicates it previously succeeded and they clicked the button in Bubble twice in quick succession.`]);
      return { type: 'success' as const };
    }
  }

  // No account exists, and we don't expect one to
  if (potentialUsers.length === 0) {
    await axios.post('https://login.bluedot.org/admin/realms/customers/users', {
      enabled: true,
      email: body.newEmail,
      credentials: [{
        type: 'password',
        value: body.password,
      }],
    }, { headers });
  }

  // An account exists
  if (potentialUsers.length === 1) {
    if (isChangingEmail) {
      await axios.put(`https://login.bluedot.org/admin/realms/customers/users/${potentialUsers[0]!.id}`, {
        ...potentialUsers[0],
        email: body.newEmail,
        username: body.newEmail,
      }, { headers });
    }

    await axios.put(`https://login.bluedot.org/admin/realms/customers/users/${potentialUsers[0]!.id}/reset-password`, {
      type: 'password',
      value: body.password,
    }, { headers });
  }

  return { type: 'success' as const };
});
