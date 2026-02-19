import { timingSafeEqual } from 'crypto';
import type { NextApiRequest, NextApiResponse } from 'next';
import env from '../../lib/api/env';
import { registerPreviewRedirectUri } from '../../lib/api/keycloak';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!env.KEYCLOAK_PREVIEW_AUTH_TOKEN) {
    return res.status(500).json({ error: 'Not configured' });
  }

  const { redirectUri, token } = req.body;

  if (typeof token !== 'string' || typeof redirectUri !== 'string') {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  if (!redirectUri.includes('.onrender.com')) {
    return res.status(400).json({ error: 'Redirect URI must be an onrender.com domain' });
  }

  const tokenBuf = Buffer.from(token);
  const secretBuf = Buffer.from(env.KEYCLOAK_PREVIEW_AUTH_TOKEN);
  if (tokenBuf.length !== secretBuf.length || !timingSafeEqual(tokenBuf, secretBuf)) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const result = await registerPreviewRedirectUri(redirectUri);
  return res.status(200).json(result);
}
