import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const client = jwksClient({
  jwksUri: 'https://appleid.apple.com/auth/keys',
  cache: true,
  rateLimit: true,
});

export interface AppleTokenPayload {
  sub: string;
  email?: string;
}

export async function verifyAppleIdentityToken(
  identityToken: string,
  audience: string,
): Promise<AppleTokenPayload> {
  const decoded = jwt.decode(identityToken, { complete: true });
  if (!decoded || typeof decoded === 'string' || !decoded.header.kid) {
    throw new Error('Token de Apple inválido');
  }

  const key = await client.getSigningKey(decoded.header.kid);
  const signingKey = key.getPublicKey();
  const payload = jwt.verify(identityToken, signingKey, {
    algorithms: ['RS256'],
    audience,
    issuer: 'https://appleid.apple.com',
  }) as AppleTokenPayload;

  if (!payload.sub) throw new Error('Token de Apple incompleto');
  return payload;
}
