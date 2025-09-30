import { env } from '../../env.js';
import Fastify from 'fastify';

import Auth from 'fastify-oauth/server';

import { fetchGithubUser } from 'fastify-oauth/server';
import { fetch42User } from 'fastify-oauth/server';

import database, { type User } from 'db';

function updateUser(uuid: string, providerName: string, user: User) {
  database.upsertUser({
    uuid: uuid.toString(),
    username: user.username,
    email: user.email,
    avatar: user.avatar,
  });
}

function setupAuth(app: Fastify.FastifyInstance) {
  return Auth(app, env.REDIRECT_URL, '/', env.JWT_SECRET)
    .add('google', ['openid', 'profile', 'email'], {
      client: {
        id: env.GOOGLE_CLIENT_ID,
        secret: env.GOOGLE_CLIENT_SECRET,
      },
      auth: {
        tokenHost: 'https://oauth2.googleapis.com',
        tokenPath: '/token',
        authorizePath: 'https://accounts.google.com/o/oauth2/v2/auth',
      },
    })
    .add(
      '42',
      ['public'],
      {
        client: {
          id: env.FORTYTWO_CLIENT_ID,
          secret: env.FORTYTWO_CLIENT_SECRET,
        },
        auth: {
          tokenHost: 'https://api.intra.42.fr',
          tokenPath: '/oauth/token',
          authorizePath: 'https://api.intra.42.fr/oauth/authorize',
        },
      },
      (token: string) =>
        fetch42User(token) as unknown as Promise<Record<string, unknown>>
    )
    .add(
      'github',
      ['read:user', 'user:email', 'offline_access'],
      {
        client: {
          id: env.GITHUB_CLIENT_ID,
          secret: env.GITHUB_CLIENT_SECRET,
        },
        auth: {
          tokenHost: 'https://github.com',
          tokenPath: '/login/oauth/access_token',
          authorizePath: '/login/oauth/authorize',
        },
      },
      (token: string) =>
        fetchGithubUser(token) as unknown as Promise<Record<string, unknown>>
    )
    .on('userUpdate', (args: unknown) => {
      const { uuid, providerName, user } = args as {
        uuid: string;
        providerName: string;
        user: User;
      };
      updateUser(uuid, providerName, user);
    })
    .on('error', (err: unknown) => {
      console.error('Error in auth plugin:', err);
      // redirect to 404 page or show error message
    });
}

export default async function (app: Fastify.FastifyInstance) {
  // Initialize the auth plugin
  app.register(setupAuth);
  console.log('✅ Auth plugin registered');
}
