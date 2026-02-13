import type { NextApiRequest, NextApiResponse } from 'next';
import { SITE_AUTH_COOKIE, checkPassword, getAuthToken } from '../../lib/siteAuth';

const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 60 * 1000; // 1 minute

const attemptsByIp = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0]!.trim();
  }

  return req.socket.remoteAddress ?? 'unknown';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = getClientIp(req);
  const now = Date.now();
  let record = attemptsByIp.get(ip);

  if (!record || now > record.resetAt) {
    record = { count: 0, resetAt: now + WINDOW_MS };
    attemptsByIp.set(ip, record);
  }

  if (record.count >= MAX_ATTEMPTS) {
    return res.status(429).json({ error: 'Too many attempts. Try again in a minute.' });
  }

  const { password } = req.body;
  if (typeof password !== 'string' || !checkPassword(password)) {
    record.count += 1;

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
