import { env } from '../../env.js';
import Fastify from 'fastify';
import fp from 'fastify-plugin';

import Auth, { FortyTwo, Google, type oAuthUser } from 'fastify-oauth/server';

async function authPlugin(app: Fastify.FastifyInstance) {
  console.info('🔐 Loading auth plugin...');

  if (!app.db || !app.db.getUsers) {
    throw new Error('Database plugin is not loaded');
  }

  // Initialize the auth plugin
  Auth(app, env.REDIRECT_URL, '/', '/error', env.JWT_SECRET)
    .add(Google)
    .add(FortyTwo)
    .addAuthenticationHook((uuid: string) => app.db.getUserRole(uuid))
    .on('login', async (args: unknown) => {
      const user = args as oAuthUser;

      await app.db.upsertUser({
        uuid: user.uuid,
        email: user.email,
        email_verified: user.email_verified ?? false,
        fullName: user.fullName,
        nickName: await app.db.generateUniqueNickName(),
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
