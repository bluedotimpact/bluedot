import { TRPCError } from '@trpc/server';
import { createHash } from 'crypto';
import { EncryptJWT, errors, jwtDecrypt } from 'jose';
import env from './env';
import { normaliseEmail } from './utils';

type EmailChangePayload = {
  userId: string;
  oldEmail: string;
  newEmail: string;
  // Matched against emailChangeRequestTable so a link works at most once and only while it is the newest one
  tokenId: string;
};

const getSecret = (): Uint8Array => {
  if (!env.EMAIL_CHANGE_TOKEN_SECRET) {
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Email change is not configured' });
  }

  return createHash('sha256').update(env.EMAIL_CHANGE_TOKEN_SECRET).digest();
};

export async function createEmailChangeToken({
  userId, oldEmail, newEmail, tokenId,
}: EmailChangePayload): Promise<string> {
  return new EncryptJWT({ userId, oldEmail: normaliseEmail(oldEmail), newEmail: normaliseEmail(newEmail) })
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setJti(tokenId)
    .setExpirationTime('48h')
    .encrypt(getSecret());
}

export async function verifyEmailChangeToken(token: string): Promise<EmailChangePayload> {
  try {
    const { payload } = await jwtDecrypt<Omit<EmailChangePayload, 'tokenId'>>(token, getSecret(), { keyManagementAlgorithms: ['dir'], contentEncryptionAlgorithms: ['A256GCM'] });
    if (!payload.jti) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'This link is no longer valid' });
    }

    return {
      userId: payload.userId, oldEmail: payload.oldEmail, newEmail: payload.newEmail, tokenId: payload.jti,
    };
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    if (error instanceof errors.JWTExpired) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'This link has expired' });
    }

    throw new TRPCError({ code: 'BAD_REQUEST', message: 'This link is invalid' });
  }
}
