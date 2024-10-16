import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import createHttpError from 'http-errors';
import { apiRoute } from '../../../lib/api/apiRoute';
import env from '../../../lib/api/env';
import { slackAlert } from '../../../lib/api/slackAlert';

export type SubmitRequest = {
  oldEmail?: string,
  newEmail: string,
  password: string,
  secret: string,
};

export default apiRoute(async (
  req: NextApiRequest,
  res: NextApiResponse,
) => {
  const data = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as SubmitRequest;
  if (typeof data.newEmail !== 'string' || typeof data.password !== 'string' || typeof data.secret !== 'string') {
    res.status(400).send({ type: 'error', message: 'Invalid payload' });
    return;
  }
  if (data.oldEmail && typeof data.oldEmail !== 'string') {
    res.status(400).send({ type: 'error', message: 'oldEmail should be string if provided' });
    return;
  }

  if (!data.newEmail || !data.password || !data.secret) {
    res.status(400).send({ type: 'error', message: 'One or more payload values were empty' });
    return;
  }

  if (data.oldEmail === 'null') {
    res.status(400).send({ type: 'error', message: 'Old email was null as string' });
    return;
  }
  if (data.newEmail === 'null') {
    res.status(400).send({ type: 'error', message: 'Email was null as string' });
    return;
  }

  if (data.secret !== env.BUBBLE_SHARED_SECRET) {
    res.status(401).send({ type: 'error', message: 'Invalid shared secret' });
    return;
  }

  const isChangingEmail = data.oldEmail && data.oldEmail !== data.newEmail;

  const clientCredentialsGrantParams = new URLSearchParams();
  clientCredentialsGrantParams.append('grant_type', 'client_credentials');
  clientCredentialsGrantParams.append('client_id', 'login-account-proxy');
  clientCredentialsGrantParams.append('client_secret', env.KEYCLOAK_CLIENT_SECRET);
  const accessToken = (await axios.post('https://login.bluedot.org/realms/master/protocol/openid-connect/token', clientCredentialsGrantParams)).data.access_token;

  const headers = {
    Authorization: `Bearer ${accessToken}`,
  };

  const potentialUsers = (await axios.get<{ id: string, email: string }[]>(`https://login.bluedot.org/admin/realms/customers/users?email=${encodeURIComponent(data.oldEmail || data.newEmail)}&exact=true`, { headers })).data;

  if (potentialUsers.length > 1) {
    throw new Error(`Found more than one user for email: ${data.oldEmail || data.newEmail}`);
  }

  // No account exists, and we expect one to
  if (isChangingEmail && potentialUsers.length === 0) {
    const potentialNewUsers = (await axios.get<{ id: string, email: string }[]>(`https://login.bluedot.org/admin/realms/customers/users?email=${encodeURIComponent(data.newEmail)}&exact=true`, { headers })).data;

    if (potentialNewUsers.length === 0) {
      throw new createHttpError.BadRequest(`Tried to change email, but cannot find existing accounts in Keycloak for email ${data.oldEmail} or ${data.newEmail}`);
    }

    if (potentialNewUsers.length >= 1) {
      slackAlert([`User tried to change email from ${data.oldEmail} to ${data.newEmail}, but only found account for new email. Ignoring this request, because this usually indicates it previously succeeded and they clicked the button in Bubble twice in quick succession.`]);
      res.status(200).json({ type: 'success' });
      return;
    }
  }

  // No account exists, and we don't expect one to
  if (potentialUsers.length === 0) {
    await axios.post('https://login.bluedot.org/admin/realms/customers/users', {
      enabled: true,
      email: data.newEmail,
      credentials: [{
        type: 'password',
        value: data.password,
      }],
    }, { headers });
  }

  // An account exists
  if (potentialUsers.length === 1) {
    if (isChangingEmail) {
      await axios.put(`https://login.bluedot.org/admin/realms/customers/users/${potentialUsers[0]!.id}`, {
        ...potentialUsers[0],
        email: data.newEmail,
        username: data.newEmail,
      }, { headers });
    }

    await axios.put(`https://login.bluedot.org/admin/realms/customers/users/${potentialUsers[0]!.id}/reset-password`, {
      type: 'password',
      value: data.password,
    }, { headers });
  }

  res.status(200).json({ type: 'success' });
}, 'insecure_no_auth');
