import fp from 'fastify-plugin';
import { type FastifyInstance, type FastifyRequest } from 'fastify';
import { env } from '../../env.js';

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

async function fetchUuid(sessionCookie: string): Promise<string> {
  const response = await fetch(`${env.API_SERVER}/user/me/uuid`, {
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
  const data = (await response.json()) as { uuid: string };
  if (!data) {
    throw new Error(`Authentication failed: Invalid user data`);
  }
  return data.uuid;
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

  const uuid = await fetchUuid(sessionCookie);
  request.setDecorator('identifiers', {
    jwt: sessionCookie,
    uuid,
    // nickname, ------------------------------------------------------- <<
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
  app.addHook('preValidation', async function (request, reply) {
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
      await reply.code(401).send('not authenticated');
    }
  });
}

export default fp(authPlugin, {
  name: 'authPlugin',
});
