import { env } from '../../env.js';
import Fastify from 'fastify';
import fp from 'fastify-plugin';

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';

import Auth, { FortyTwo, Google, type oAuthUser } from 'fastify-oauth';

import { userRole } from 'db/generated/client/index.js';

function authPlugin(app: Fastify.FastifyInstance) {
  console.info('🔐 Loading auth plugin...');

  if (!app.db || !app.db.getUsers) {
    throw new Error('Database plugin is not loaded');
  }

  // Initialize the auth plugin
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

      let avatarUrl: string | null = null;
      if (!existingUser) {
        try {
          avatarUrl = await downloadAvatar(user.avatar);
        } catch (error) {
          app.log.error(error);
        }
      }

      await app.db.upsertUser({
        uuid: user.uuid,
        email: user.email ?? null,
        email_verified: user.email_verified ?? false,
        nickname:
          existingUser?.nickname ?? (await app.db.generateUniqueNickName()),
        avatar: existingUser?.avatar ?? avatarUrl ?? 'avatars/base_avatar.png',
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

async function downloadAvatar(
  url: string | null | undefined
): Promise<string | null> {
  if (!url) return null;
  const avatarUuid = crypto.randomUUID();
  const newFilename = `${avatarUuid}.png`;
  const filePath = path.join('avatars', newFilename);
  const savePath = path.join(`${env.CDN_PATH}`, filePath);

  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`Failed to download avatar: ${response.statusText}`);

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  await fs.promises.mkdir(path.dirname(savePath), { recursive: true });
  await sharp(buffer)
    .resize(256, 256, { fit: 'cover' })
    .png({ quality: 80 })
    .toFile(savePath);

  return filePath;
}
