import { TRPCError } from '@trpc/server';
import { errors, jwtVerify, SignJWT } from 'jose';
import env from './env';
import { normaliseEmail } from './utils';

const TOKEN_TTL = '48h';

type EmailChangePayload = {
  userId: string;
  oldEmail: string;
  newEmail: string;
};

const getSecret = (): Uint8Array => {
  if (!env.EMAIL_CHANGE_TOKEN_SECRET) {
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Email change is not configured' });
  }

  return new TextEncoder().encode(env.EMAIL_CHANGE_TOKEN_SECRET);
};

export async function createEmailChangeToken({ userId, oldEmail, newEmail }: EmailChangePayload): Promise<string> {
  return new SignJWT({ userId, oldEmail: normaliseEmail(oldEmail), newEmail: normaliseEmail(newEmail) })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(TOKEN_TTL)
    .sign(getSecret());
}

export async function verifyEmailChangeToken(token: string): Promise<EmailChangePayload> {
  try {
    const { payload } = await jwtVerify<EmailChangePayload>(token, getSecret(), { algorithms: ['HS256'] });

    return { userId: payload.userId, oldEmail: payload.oldEmail, newEmail: payload.newEmail };
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    if (error instanceof errors.JWTExpired) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'This link has expired' });
    }

    throw new TRPCError({ code: 'BAD_REQUEST', message: 'This link is invalid' });
  }
}
