import type { AccessToken } from '../../index.js';
import type { OAuthProvider } from '../../index.js';
import { extractOpenIDUser, type OpenIDUser } from '../openid/index.js';

export interface User {
  uuid: string | number;
  name: string;
  email: string | null;
  avatar?: string | null;
}

async function getOauthUser(
  provider: OAuthProvider,
  accessToken: AccessToken,
  name?: string
) {
  if (!provider) {
    throw new Error('Provider is undefined');
  }
  if (!accessToken) {
    throw new Error('Access token is undefined');
  }
  // If the provider uses OpenID Connect, extract user info from the ID token
  if (accessToken.token.id_token) {
    return extractOpenIDUser(accessToken, name);
  }

  // If a custom user data fetcher is provided, use it
  if (provider.fetchUserData) {
    return await provider.fetchUserData(
      accessToken.token.access_token as string
    );
  }

  // If no method is available to fetch user data, throw an error
  throw new Error(
    `No method available to fetch user data for provider: ${provider.name}`
  );
}

function getUserUUID(
  user: Record<string, unknown> | OpenIDUser
): string | null {
  if ('sub' in user) {
    return String(user['sub']);
  } else if ('id' in user) {
    return String(user['id']);
  } else if ('uuid' in user) {
    return String(user['uuid']);
  } else if ('email' in user) {
    return String(['email']);
  }
  return null;
}

function getUserName(user: Record<string, unknown> | OpenIDUser): string {
  if ('name' in user && typeof user['name'] === 'string') {
    return user['name'];
  } else if ('username' in user && typeof user['username'] === 'string') {
    return user['username'];
  } else if (
    'firstname' in user &&
    'lastname' in user &&
    typeof user['firstname'] === 'string' &&
    typeof user['lastname'] === 'string'
  ) {
    return `${user['firstname']} ${user['lastname']}`;
  } else if ('login' in user && typeof user['login'] === 'string') {
    return user['login'];
  }
  return 'Unknown';
}

export { getOauthUser, getUserUUID, getUserName };
