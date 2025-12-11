import { env } from '../../env.js';

export async function fetchUserUuid(sessionCookie: string): Promise<string> {
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
