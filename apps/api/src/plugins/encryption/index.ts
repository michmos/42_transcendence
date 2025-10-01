import crypto from 'crypto';
import Fastify from 'fastify';
import { env } from '../../env.js';

class CryptoManager {
  private encryptionKey: string;

  constructor(encryptionKey: string) {
    if (encryptionKey.length !== 32) {
      throw new Error('Encryption key must be 32 characters long');
    }
    this.encryptionKey = encryptionKey;
  }

  private generateIvAndChipher() {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(this.encryptionKey),
      iv
    );
    return { iv, cipher };
  }

  encrypt(text: string): string {
    if (!this.encryptionKey) {
      throw new Error('Encryption key is not set. Call init() first.');
    }

    // Generate a new IV and cipher for each encryption
    const { iv, cipher } = this.generateIvAndChipher();

    // Encrypt the text
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    // Combine IV and encrypted data
    const combined = Buffer.concat([iv, encrypted]);

    // Encode as URL-safe base64
    return combined
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  decrypt(text: string): string {
    if (!this.encryptionKey) {
      throw new Error('Encryption key is not set. Call init() first.');
    }

    // Restore base64 padding if needed
    let b64 = text.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const combined = Buffer.from(b64, 'base64');

    // Extract IV and encrypted data
    const iv = combined.slice(0, 16);

    // The rest is the encrypted text
    const encryptedText = combined.slice(16);

    // Decrypt the text
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(this.encryptionKey),
      iv
    );

    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString();
  }

  // Encrypt the uuid before sending it to the client for security
  // If the original uuid is exposed, it could be used in brute-force attacks
  // to enumerate all users in the system if there is a security flaw elsewhere
  // in the system that allows listing users by UUID.
  // By encrypting the UUID, we mitigate this risk.
  async uuidEmailEncryption(
    request: Fastify.FastifyRequest,
    reply: Fastify.FastifyReply,
    payload: unknown
  ) {
    console.log('🔒 Encryption hook called');
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

      // Handle both single user object and array of users
      if (
        Array.isArray(encryptedData) ||
        (typeof encryptedData === 'object' &&
          typeof encryptedData.uuid === 'string')
      ) {
        interface UserItem {
          uuid: string;
          email: string;
          [key: string]: unknown;
        }

        const encryptedDataArray = encryptedData as UserItem[];
        console.log('Encrypting UUIDs for users:', encryptedDataArray);
        encryptedDataArray.forEach((item: UserItem) => {
          if (
            item &&
            typeof item === 'object' &&
            typeof item.uuid === 'string'
          ) {
            item.uuid = this.encrypt(item.uuid);

            // Mask both the first and second part of the email address
            item.email = item.email.replace(/(.{2}).+@(.{2}).+/, '$1***@$2***');
          }
        });
      }

      return JSON.stringify(encryptedData);
    } catch (error) {
      console.error('Error encrypting UUIDs:', error);
      return payload;
    }
  }

  async uuidDecryption(
    request: Fastify.FastifyRequest,
    reply: Fastify.FastifyReply
  ) {
    console.log('🔒 Decryption hook called');
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
          params.uuid = this.decrypt(params.uuid);
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
          body.uuid = this.decrypt(body.uuid);
        } catch (error) {
          console.error('Error decrypting UUID in body:', error);
          return reply.status(400).send({ error: 'Invalid UUID format' });
        }
      }
    }

    return;
  }
}

export default new CryptoManager(env.UUID_ENCRYPTION_KEY);
