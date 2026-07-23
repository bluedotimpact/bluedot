import { createHmac, timingSafeEqual } from 'crypto';
import { TRPCError } from '@trpc/server';
import env from './env';
import { normaliseEmail } from './utils';

const TOKEN_TTL_MS = 48 * 60 * 60 * 1000;

export type EmailChangePayload = {
  userId: string;
  oldEmail: string;
  newEmail: string;
  exp: number;
};

const getSecret = (): string => {
  if (!env.EMAIL_CHANGE_TOKEN_SECRET) {
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Email change is not configured' });
  }

  return env.EMAIL_CHANGE_TOKEN_SECRET;
};

const sign = (encodedPayload: string, secret: string): string => createHmac('sha256', secret)
  .update(encodedPayload)
  .digest('base64url');

export function createEmailChangeToken({ userId, oldEmail, newEmail }: { userId: string; oldEmail: string; newEmail: string }): string {
  const secret = getSecret();
  const payload: EmailChangePayload = {
    userId,
    oldEmail: normaliseEmail(oldEmail),
    newEmail: normaliseEmail(newEmail),
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encodedPayload}.${sign(encodedPayload, secret)}`;
}

export function verifyEmailChangeToken(token: string): EmailChangePayload {
  const secret = getSecret();
  const invalid = new TRPCError({ code: 'BAD_REQUEST', message: 'This link is invalid' });

  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) {
    throw invalid;
  }

  const expected = Buffer.from(sign(encodedPayload, secret));
  const provided = Buffer.from(signature);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    throw invalid;
  }

  let payload: EmailChangePayload;
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString()) as EmailChangePayload;
  } catch {
    throw invalid;
  }

  if (typeof payload.userId !== 'string' || typeof payload.oldEmail !== 'string' || typeof payload.newEmail !== 'string' || typeof payload.exp !== 'number') {
    throw invalid;
  }

  if (Date.now() > payload.exp) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'This link has expired' });
  }

  return payload;
}
