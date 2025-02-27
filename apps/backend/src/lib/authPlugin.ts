import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { DecodedJwt, createVerifier } from 'fast-jwt';
import buildGetJwks from 'get-jwks';
import z from 'zod';
import createHttpError from 'http-errors';
import { withErrorHandling } from './errorHandlerPlugin';

const ISSUER_URL = 'https://login.bluedot.org/realms/customers';

const getJwks = buildGetJwks({
  issuersWhitelist: [ISSUER_URL],
  providerDiscovery: true,
});

const IdTokenPayloadSchema = z.object({
  typ: z.literal('ID'),
  name: z.string(),
  email: z.string(),
});

const verifyAsync = createVerifier({
  algorithms: ['RS256'],
  allowedAud: ['bluedot-frontend'],
  allowedIss: [ISSUER_URL],
  key: async ({ header }: DecodedJwt) => {
    const publicKey = await getJwks.getPublicKey({
      kid: header.kid,
      alg: header.alg,
      domain: ISSUER_URL,
    });
    return publicKey;
  },
});

export const authPlugin: FastifyPluginAsync = fp(async (instance) => {
  instance.addHook('onRequest', withErrorHandling(async (request) => {
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader) {
      throw new createHttpError.Unauthorized('Missing authorization header');
    }

    if (!authorizationHeader.startsWith('Bearer ')) {
      throw new createHttpError.Unauthorized('Invalid authorization header: expected Bearer token');
    }

    let payload;
    try {
      payload = await verifyAsync(authorizationHeader.slice('Bearer '.length));
    } catch (error) {
      throw new createHttpError.Unauthorized('Bad token in Authorization header');
    }

    try {
      request.user = IdTokenPayloadSchema.parse(payload);
    } catch (error) {
      throw new createHttpError.InternalServerError('Validated token payload different shape than expected');
    }
  }));
});

declare module 'fastify' {
  interface FastifyRequest {
    user: Zod.TypeOf<typeof IdTokenPayloadSchema>
  }
}
