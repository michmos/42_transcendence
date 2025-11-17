import WebSocket from 'ws';

function getSessionCookie(cookieString: string): string | null {
  cookieString = `; ${cookieString}`;
  const [, remainder] = cookieString.split('; session=');
  if (!remainder) {
    return null;
  }
  return remainder.split(';')[0] ?? null;
}

export function checkAuthentication(socket: WebSocket) {
  if (!socket.getData()?.uuid) {
    throw new Error(
      'Unauthorized access attempt: socket is not identified yet'
    );
  }
}

/**
 * authenticate token
 * @cookieString: cookie string
 * @hostname: hostname
 *
 * @return: uuid of user
 * @throw on invalid token provided
 */
export async function authenticateClient(
  cookieString: string,
  hostname: string
): Promise<string> {
  console.log(`Authenticating client...`);
  const sessionCookie = getSessionCookie(cookieString);
  if (!sessionCookie) {
    throw new Error(`Authentication failed: No session cookie`);
  }
  const response = await fetch(`http://${hostname}/api/auth/session`, {
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
  console.log(`User authenticated: ${user.uuid}`);
  return user.uuid;
}
