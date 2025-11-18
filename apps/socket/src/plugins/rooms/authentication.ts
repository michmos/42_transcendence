import WebSocket from 'ws';
import { type FastifyRequest } from 'fastify';
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
  const response = await fetch(`http://localhost:5173/api/auth/session`, {
    // TODO: hardcoded localhost
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
 * authenticate client by fetching user through session cookie
 * @request: Fastify request
 *
 * @return: object with user uuid and jwt
 * @throw on invalid or non existent jwt
 */
async function authenticateClient(request: FastifyRequest) {
  console.log(`Authenticating client...`);

  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    throw new Error(`Authentication failed: No session cookie`);
  }

  const user = await fetchUser(sessionCookie);
  console.log(`User authenticated: ${user.uuid}`);

  return {
    uuid: user.uuid,
    jwt: sessionCookie,
  };
}

/**
 * authenticate client through session cookie
 * and update connection
 * @socket: socket to authenticate
 * @request: Fastify request
 *
 * @throw on failed authentication (missing or invalid session cookie)
 */
export default async function processClientAuthentication(
  socket: WebSocket,
  request: FastifyRequest
) {
  if (request.headers.cookie) {
    const identifiers = await authenticateClient(request);
    socket.updateConnection(identifiers.uuid, identifiers.jwt);
  }
}
