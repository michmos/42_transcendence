import { env } from '../../env.js';
import Fastify from 'fastify';
import fp from 'fastify-plugin';

import Auth, { FortyTwo, GitHub, Google } from 'fastify-oauth/server';
import { type User } from 'db/generated/client/index.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: User | null | undefined | unknown;
  }
}

async function authPlugin(app: Fastify.FastifyInstance) {
  console.info('🔐 Loading auth plugin...');

  if (!app.db || !app.db.user) {
    throw new Error('Database plugin is not loaded');
  }

  // Initialize the auth plugin
  Auth(app, env.REDIRECT_URL, '/', env.JWT_SECRET)
    .add(Google)
    .add(GitHub)
    .add(FortyTwo)
    .addAuthenticationHook(app.db.user.get.bind(app.db.user))
    .on('login', async (args: unknown) => {
      const { uuid, providerName, user } = args as {
        uuid: string;
        providerName: string;
        user: User;
      };
      console.info(
        `User logged in: ${user.username} (UUID: ${uuid}) via ${providerName}`
      );
      await app.db.user.upsert(user);
    })
    .on('logout', (args: unknown) => {
      const { uuid, providerName } = args as {
        uuid: string;
        providerName: string;
      };
      console.info(`User logged out (UUID: ${uuid}) via ${providerName}`);
    })
    .on('error', (err: unknown) => {
      console.error('Error in auth plugin:', err);
      // TODO redirect to 404 page or show error message
    });
}

export default fp(authPlugin, {
  dependencies: ['database'],
});
