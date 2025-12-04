import type { AccessToken } from '../../index.js';
import type { OAuthProvider } from '../../index.js';
import { extractOpenIDUser, type OpenIDUser } from '../openid/index.js';

export interface User {
  uuid: string | number;
  name: string;
  email: string | null;
  avatar?: string | null;
}

export interface oAuthUser {
  uuid: string;
  fullName: string;
  email: string;
  email_verified?: boolean;
  avatar?: string | null;
  providerName: string;
}

async function getOauthUser(
  provider: OAuthProvider,
  accessToken: AccessToken,
  name?: string
) {
  let user: Record<string, unknown> | OpenIDUser;

  if (!provider) {
    throw new Error('Provider is undefined');
  }
  if (!accessToken) {
    throw new Error('Access token is undefined');
  }
  // If the provider uses OpenID Connect, extract user info from the ID token
  if (accessToken.token.id_token) {
    user = extractOpenIDUser(accessToken, name);
  }

  // If a custom user data fetcher is provided, use it
  else if (provider.fetchUserData) {
    user = await provider.fetchUserData(
      accessToken.token.access_token as string
    );
  } else {
    throw new Error('No method to fetch user data for this provider');
  }

  if (!user) {
    throw new Error('Failed to fetch user data');
  }

  const uuid = provider.name + getOauthUserUUID(user);
  const fullName = getOauthUserName(user);
  if (
    !('email' in user) ||
    typeof user['email'] !== 'string' ||
    !user['email']
  ) {
    throw new Error('User email is missing');
  }
  const email = user['email'];
  const avatar = 'avatar' in user ? (user['avatar'] as string) : null;

  const result: oAuthUser = {
    uuid,
    fullName,
    email,
    avatar,
    email_verified:
      'email_verified' in user ? (user['email_verified'] as boolean) : false,
    providerName: provider.name,
  };
  return result;
}

function getOauthUserUUID(
  user: Record<string, unknown> | OpenIDUser
): string | null {
  if ('sub' in user) {
    return String(user['sub']);
  } else if ('id' in user) {
    return String(user['id']);
  } else if ('uuid' in user) {
    return String(user['uuid']);
  } else if ('email' in user) {
    return String(user['email']);
  }
  return null;
}

function getOauthUserName(user: Record<string, unknown> | OpenIDUser): string {
  if ('name' in user && typeof user['name'] === 'string') {
    return user['name'];
  } else if ('nickname' in user && typeof user['nickname'] === 'string') {
    return user['nickname'];
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

export { getOauthUser, getOauthUserName, getOauthUserUUID };
