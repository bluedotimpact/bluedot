import type { NextApiRequest, NextApiResponse } from 'next';
import { SITE_AUTH_COOKIE, checkPassword, getAuthToken } from '../../lib/siteAuth';

const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body;
  if (typeof password !== 'string' || !checkPassword(password)) {
    return res.status(401).json({ error: 'Incorrect password' });
  }

  const token = await getAuthToken();
  if (!token) {
    return res.status(500).json({ error: 'Site password not configured' });
  }

  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${SITE_AUTH_COOKIE}=${token}; Max-Age=${COOKIE_MAX_AGE}; Path=/; HttpOnly; SameSite=Lax${secure}`,
  );

  return res.status(200).json({ authenticated: true });
}
