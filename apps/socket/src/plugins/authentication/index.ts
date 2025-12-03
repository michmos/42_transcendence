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
  // TODO: @michmoser - I replaced this from auth/session with  API call do we need the UUID? Then we shoul make a endpoint to get this.
  const response = await fetch(`${env.API_SERVER}/user/me`, {
    method: 'GET',
    headers: {
      Cookie: `session=${sessionCookie}`,
    },
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error(
      `Authentication failed: ${response.status} ${response.statusText}`
    );
  }
  const data = await response.json();
  //TODO: WE get some weird type back what is not the user!
  const user: User = data.cleanedUserData;
  if (!user) {
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
    jwt: sessionCookie,
  });
  console.log(`User authenticated: ${user.nickname}`);
}

async function authenticateAPIServer(request: FastifyRequest) {
  const key = request.headers['x-api-key'];
  if (!key || key !== env.ADMIN_API_KEY) {
    throw new Error(`Unauthorized access attempt`);
  }
}

async function authPlugin(app: FastifyInstance) {
  app.decorateRequest('identifiers', null);
  app.addHook('preValidation', async function (request, reply) {
    try {
      console.log('Authenticating request to', request.url);
      if (request.url === '/') {
        await authenticateClient(request);
      } else {
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
