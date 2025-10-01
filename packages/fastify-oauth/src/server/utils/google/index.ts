import type { OAuthProviderOptions } from '../../index.js';

const Google: OAuthProviderOptions = {
  name: 'Google',
  client: {
    id: process.env.GOOGLE_CLIENT_ID!,
    secret: process.env.GOOGLE_CLIENT_SECRET!,
  },
  auth: {
    tokenHost: 'https://oauth2.googleapis.com',
    tokenPath: '/token',
    authorizePath: 'https://accounts.google.com/o/oauth2/v2/auth',
  },
  scopes: ['openid', 'profile', 'email'],
};

export { Google };
