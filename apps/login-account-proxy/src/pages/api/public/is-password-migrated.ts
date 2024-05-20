import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { apiRoute } from '../../../lib/api/apiRoute';
import env from '../../../lib/api/env';
import { slackAlert } from '../../../lib/api/slackAlert';

export type IsPasswordMigratedRequest = {
  email: string,
  secret: string,
};

export default apiRoute(async (
  req: NextApiRequest,
  res: NextApiResponse,
) => {
  const data = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as IsPasswordMigratedRequest;
  if (typeof data.email !== 'string' || typeof data.secret !== 'string') {
    res.status(400).send({ type: 'error', message: 'Invalid payload' });
    return;
  }

  if (!data.email || !data.secret) {
    res.status(400).send({ type: 'error', message: 'One or more payload values were empty' });
    return;
  }

  if (data.email === 'null') {
    res.status(400).send({ type: 'error', message: 'Email was null as string' });
    return;
  }

  if (data.secret !== env.BUBBLE_SHARED_SECRET) {
    res.status(401).send({ type: 'error', message: 'Invalid shared secret' });
    return;
  }

  const clientCredentialsGrantParams = new URLSearchParams();
  clientCredentialsGrantParams.append('grant_type', 'client_credentials');
  clientCredentialsGrantParams.append('client_id', 'login-account-proxy');
  clientCredentialsGrantParams.append('client_secret', env.KEYCLOAK_CLIENT_SECRET);
  const accessToken = (await axios.post('https://login.bluedot.org/realms/master/protocol/openid-connect/token', clientCredentialsGrantParams)).data.access_token;

  const headers = {
    Authorization: `Bearer ${accessToken}`,
  };

  const potentialUsers = (await axios.get<{ id: string, email: string }[]>(`https://login.bluedot.org/admin/realms/customers/users?email=${encodeURIComponent(data.email)}&exact=true`, { headers })).data;

  if (potentialUsers.length > 1) {
    throw new Error(`Found more than one user for email: ${data.email}`);
  }

  if (potentialUsers.length === 0) {
    slackAlert([`is-password-migrated: User not found in keycloak: ${data.email}`, 'This shouldn\'t happen because we thought we migrated all existing users over, and new users should be migrated they register. You should investigate how this user signed up for an account without a keycloak user.']);
    res.status(200).json({ type: 'success', isMigrated: false });
    return;
  }

  const credentials = (await axios.get<{ type: string }[]>(`https://login.bluedot.org/admin/realms/customers/users/${potentialUsers[0]!.id}/credentials`, { headers })).data;

  res.status(200).json({ type: 'success', isMigrated: credentials.some((c) => c.type === 'password') });
}, 'insecure_no_auth');
