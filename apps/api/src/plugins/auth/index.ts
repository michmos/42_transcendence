import { env } from '../../env.js';
import Fastify from 'fastify';

import Auth, { FourtyTwo, GitHub, Google } from 'fastify-oauth/server';

import database, { type User } from 'db';

function updateUser(uuid: string, user: User) {
  database.upsertUser({
    uuid: uuid.toString(),
    username: user.username,
    email: user.email,
    avatar: user.avatar,
  });
}

export default async function (app: Fastify.FastifyInstance) {
  // Initialize the auth plugin
  Auth(app, env.REDIRECT_URL, '/', env.JWT_SECRET)
    .add(Google)
    .add(GitHub)
    .add(FourtyTwo)
    .on('login', (args: unknown) => {
      const { uuid, providerName, user } = args as {
        uuid: string;
        providerName: string;
        user: User;
      };
      console.info(
        `User logged in: ${user.username} (UUID: ${uuid}) via ${providerName}`
      );
      updateUser(uuid, user);
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
      // redirect to 404 page or show error message
    });
}
