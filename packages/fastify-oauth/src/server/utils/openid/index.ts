import type { AccessToken } from 'simple-oauth2';
import TokenUtility from '../token/index.js';

export interface OpenIDUser {
  iss: string;
  azp: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: boolean;
  at_hash: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  iat: number;
  exp: number;
}

export function extractOpenIDUser(accessToken: AccessToken, name?: string) {
  if (!accessToken.token.id_token) {
    throw new Error('No ID token present in access token');
  }
  const decoded = TokenUtility.decodeIdToken(
    accessToken.token.id_token as string
  ) as OpenIDUser | null;

  if (!decoded || typeof decoded !== 'object') {
    throw new Error('Failed to decode ID token');
  }

  // If name is not present in the token, use the provided name or a default
  if (!decoded.name) {
    decoded.name = name || 'Unknown';
  }

  // Validate required OpenID fields
  if (
    !('sub' in decoded) ||
    !('email' in decoded) ||
    !('email_verified' in decoded) ||
    !('name' in decoded) ||
    !('iat' in decoded) ||
    !('exp' in decoded)
  ) {
    throw new Error('Missing required OpenID fields in ID token');
  }

  // Decoded ID Token successfully. User sub: %s, email: %s
  console.log('Decoded ID Token for user:', decoded.sub);
  const user = {
    uuid: decoded.sub,
    email: decoded.email,
    email_verified: decoded.email_verified,
    username: decoded.name,
    avatar_url: decoded.picture || '',
  };

  return user;
}
