import { env } from '../../env.js';

export async function messageSocketServer(endpoint: string, data: unknown) {
  let response;
  try {
    response = await fetch(`${env.SOCKET_SERVER}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ADMIN_API_KEY,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(response.statusText);
    }
  } catch (error) {
    console.error('Fetch to socket server failed:', (error as Error).message);
  }
  return response ?? null;
}
