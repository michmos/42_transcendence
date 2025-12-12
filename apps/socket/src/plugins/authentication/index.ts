import fp from 'fastify-plugin';
import { type FastifyInstance, type FastifyRequest } from 'fastify';
import { env } from '../../env.js';
import { API } from '../../plugins/api/index.js';

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

  const uuid = await API.fetchUserUuid(sessionCookie);
  request.setDecorator('identifiers', {
    jwt: sessionCookie,
    uuid,
  });
  console.log(`User authenticated: ${uuid}`);
}

function authenticateAPIServer(request: FastifyRequest) {
  const key = request.headers['x-api-key'];
  if (!key || key !== env.ADMIN_API_KEY) {
    throw new Error(`Unauthorized access attempt`);
  }
}

function authPlugin(app: FastifyInstance) {
  app.decorateRequest('identifiers', null);
  app.addHook('preValidation', async function (request) {
    try {
      if (request.url === '/') {
        await authenticateClient(request);
      } else {
        authenticateAPIServer(request);
      }
    } catch (error) {
      console.error(
        'Authentication error:',
        error instanceof Error ? error.message : error
      );
    }
  });
}

export default fp(authPlugin, {
  name: 'authPlugin',
});
