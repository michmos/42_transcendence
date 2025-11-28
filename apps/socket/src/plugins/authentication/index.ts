import fp from 'fastify-plugin';
import { type FastifyInstance, type FastifyRequest } from 'fastify';
import { env } from '../../env.js';
import type { User } from 'db/generated/client/index.js';

function getSessionCookie(request: FastifyRequest): string | null {
  if (!request.headers.cookie) {
    return null;
  }

  const cookieString = `; ${request.headers.cookie}`;
  const [, remainder] = cookieString.split('; session=');
  if (!remainder) {
    return null;
  }
  return remainder.split(';')[0] ?? null;
}

async function fetchUser(sessionCookie: string): Promise<User> {
  const response = await fetch(`${env.API_URL}/auth/session`, {
    method: 'GET',
    headers: {
      Cookie: `session=${sessionCookie}`,
      credentials: 'include',
    },
  });
  if (!response.ok) {
    throw new Error(
      `Authentication failed: ${response.status} ${response.statusText}`
    );
  }
  const user = await response.json();
  if (!user || !user.uuid) {
    throw new Error(`Authentication failed: Invalid user data`);
  }
  return user;
}

/**
 * authenticate client through session cookie
 * @request: Fastify request
 *
 * @throw on failed authentication (missing or invalid session cookie)
 */
async function authenticateClient(request: FastifyRequest) {
  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    throw new Error(`Authentication failed: No session cookie`);
  }

  const user = await fetchUser(sessionCookie);
  request.setDecorator('identifiers', {
    uuid: user.uuid,
    jwt: sessionCookie,
  });
  console.log(`User authenticated: ${user.uuid}`);
}

async function authenticateAPIServer(request: FastifyRequest) {
  const key = request.headers['x-api-key'];
  if (!key || key !== env.ADMIN_API_KEY) {
    throw new Error(`Unauthorized access attempt`);
  }
  console.log(`API server authenticated`);
}

async function authPlugin(app: FastifyInstance) {
  app.decorateRequest('identifiers', null);
  app.addHook('preValidation', async function (request, reply) {
    try {
      if (request.url === '/') {
        console.log(`Authenticating client...`);
        await authenticateClient(request);
      } else {
        console.log(`Authenticating API server...`);
        await authenticateAPIServer(request);
      }
    } catch (error) {
      console.error(
        'Authentication error:',
        error instanceof Error ? error.message : error
      );
      await reply.code(401).send('not authenticated');
    }
  });
}

export default fp(authPlugin, {
  name: 'authPlugin',
});
