import type { OAuthProviderOptions } from '../../index.js';
import { env } from '../../env.js';

const Google: OAuthProviderOptions = {
  name: 'Google',
  client: {
    id: env.GOOGLE_CLIENT_ID,
    secret: env.GOOGLE_CLIENT_SECRET,
  },
  auth: {
    tokenHost: 'https://oauth2.googleapis.com',
    tokenPath: '/token',
    authorizePath: 'https://accounts.google.com/o/oauth2/v2/auth',
  },
  scopes: ['openid', 'profile', 'email'],
};

export { Google };
