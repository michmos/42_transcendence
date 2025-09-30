import type { FastifyInstance } from 'fastify';
import { env } from '../../env.js';

import { SessionManager } from 'fastify-oauth/server';

// Import the database module from the database package
// This is where the getters and setters for users are defined
import Database from 'db';

// Import and register fastify-cookie plugin
import fastifyCookie from '@fastify/cookie';
import { userRole } from 'db/generated/client';

import crypto from 'crypto';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      role?: userRole;
    };
  }
}

// Encrypt the uuid before sending it to the client for security
// If the original uuid is exposed, it could be used in brute-force attacks
// to enumerate all users in the system if there is a security flaw elsewhere
// in the system that allows listing users by UUID.
// By encrypting the UUID, we mitigate this risk.
function encrypt(text: string, encryptionKey: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(encryptionKey),
    iv
  );
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  // Combine IV and encrypted data, then encode as URL-safe base64
  const combined = Buffer.concat([iv, encrypted]);
  return combined
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Decrypt the uuid when receiving it from the client
function decrypt(text: string, encryptionKey: string): string {
  // Restore base64 padding if needed
  let b64 = text.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  const combined = Buffer.from(b64, 'base64');
  const iv = combined.slice(0, 16);
  const encryptedText = combined.slice(16);
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(encryptionKey),
    iv
  );
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

export default async function (app: FastifyInstance): Promise<void> {
  await app.register(fastifyCookie);

  app.addHook('onSend', async (request, reply, payload) => {
    // Return early when there is no payload
    if (!payload) return payload;

    try {
      let data = payload;

      if (typeof payload === 'string') {
        try {
          data = JSON.parse(payload);
        } catch {
          return payload;
        }
      }

      // Create a deep copy to avoid mutating original data
      const encryptedData = JSON.parse(JSON.stringify(data));

      // Encrypt UUIDs in user objects or arrays
      if (Array.isArray(encryptedData)) {
        encryptedData.forEach((item) => {
          if (
            item &&
            typeof item === 'object' &&
            typeof item.uuid === 'string'
          ) {
            item.uuid = encrypt(item.uuid, env.UUID_ENCRYPTION_KEY as string);

            // Mask both the first and second part of the email address
            item.email = item.email.replace(/(.{2}).+@(.{2}).+/, '$1***@$2***');
          }
        });
      } else if (
        encryptedData &&
        typeof encryptedData === 'object' &&
        typeof encryptedData.uuid === 'string'
      ) {
        console.log('Single object before encryption:', encryptedData);
        encryptedData.uuid = encrypt(
          encryptedData.uuid,
          env.UUID_ENCRYPTION_KEY as string
        );
        encryptedData.email = encryptedData.email.replace(
          // Mask both the first and second part of the email address
          /(.{2}).+@(.{2}).+/,
          '$1***@$2***'
        );
        console.log(
          'Single object after encryption and email masking:',
          encryptedData
        );
      }

      return JSON.stringify(encryptedData);
    } catch (error) {
      console.error('Error encrypting UUIDs:', error);
      return payload;
    }
  });

  // Decrypt UUIDs in incoming requests if present
  app.addHook('preHandler', async (request, reply) => {
    // Allow preflight requests to pass through
    if (request.method === 'OPTIONS') {
      return;
    }

    // Decrypt UUID in request params if present
    if (
      request.params &&
      typeof request.params === 'object' &&
      'uuid' in request.params
    ) {
      const params = request.params as { uuid?: string };
      if (params.uuid) {
        try {
          params.uuid = decrypt(params.uuid, env.UUID_ENCRYPTION_KEY as string);
        } catch (error) {
          console.error('Error decrypting UUID in params:', error);
          return reply.status(400).send({ error: 'Invalid UUID format' });
        }
      }
    }

    // Decrypt UUID in request body if present
    if (
      request.body &&
      typeof request.body === 'object' &&
      'uuid' in request.body
    ) {
      const body = request.body as { uuid?: string };
      if (body.uuid) {
        try {
          body.uuid = decrypt(body.uuid, env.UUID_ENCRYPTION_KEY as string);
        } catch (error) {
          console.error('Error decrypting UUID in body:', error);
          return reply.status(400).send({ error: 'Invalid UUID format' });
        }
      }
    }
  });

  // Add authentication hook to protect all /api/user routes
  app.addHook('preHandler', async (request, reply) => {
    const user = SessionManager.userIsLoggedIn(
      request.cookies.session as string
    );

    if (!user) return reply.status(401).send({ error: 'Unauthorized' });

    const dbUser = await Database.getUser(user.uuid);
    if (!dbUser)
      return reply.status(401).send({ error: 'User not found in database' });

    // Attach user info to request object for further use in route handlers
    request.user = {
      id: dbUser.uuid,
      email: dbUser.email,
      role: dbUser.role || userRole.MEMBER,
    };
  });

  app.get('/', async function (request, reply) {
    if (request.user?.role !== userRole.ADMIN) {
      const user = await Database.getUser(request.user?.id as string);
      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }
      return [user];
    }

    return await Database.getAllUsers();
  });

  app.get('/:uuid', async function (request) {
    const { uuid } = request.params as { uuid: string };
    return await Database.getUser(uuid);
  });

  app.post('/', async function (request) {
    const { email } = request.body as {
      email: string;
    };
    if (!email) {
      return new Error('Email and username are required');
    }
    return await Database.addUser(
      email,
      email.split('@')[0] || 'user' + Math.floor(Math.random() * 1000)
    );
  });

  app.delete('/', async function (request) {
    const { uuid } = request.body as { uuid: string };
    if (!uuid) {
      return new Error('UUID is required');
    }
    return await Database.removeUser(uuid);
  });
}
