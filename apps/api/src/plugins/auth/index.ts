import { env } from '../../env.js';
import Fastify from 'fastify';
import fp from 'fastify-plugin';

import Auth, { FortyTwo, Google, type oAuthUser } from 'fastify-oauth/server';

import { userRole } from 'db/generated/client/index.js';

async function authPlugin(app: Fastify.FastifyInstance) {
  console.info('🔐 Loading auth plugin...');

  if (!app.db || !app.db.getUsers) {
    throw new Error('Database plugin is not loaded');
  }

  // Initialize the aut plugin
  Auth(app, env.REDIRECT_URL, '/', '/error', env.JWT_SECRET)
    .addProvider(Google)
    .addProvider(FortyTwo)
    .registerAuthCallback(
      (uuid: string) => app.db.getUserRole(uuid),
      env.ADMIN_API_KEY,
      userRole.ADMIN
    )
    .on('login', async (args: unknown) => {
      const user = args as oAuthUser;

      // Check if user already exists
      const existingUser = await app.db.getUser(user.uuid);

      await app.db.upsertUser({
        uuid: user.uuid,
        email: user.email ?? null,
        email_verified: user.email_verified ?? false,
        fullName: user.fullName ?? null,
        nickname:
          existingUser?.nickname ?? (await app.db.generateUniqueNickName()),
        avatar: user.avatar ?? null,
      });
    })
    .on('logout', (args: unknown) => {
      const { uuid, providerName } = args as {
        uuid: string;
        providerName: string;
      };
      console.info(`User logged out (UUID: ${uuid}) via ${providerName}`);
    })
    .on('error', (err: unknown) => {
      console.error('Authentication error:', err);
    });
}

export default fp(authPlugin, {
  dependencies: ['database'],
});
