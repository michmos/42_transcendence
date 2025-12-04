import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import AutoLoad from '@fastify/autoload';
import path from 'path';
import { env } from './env.js';

const app = Fastify({
  logger: {
    level: 'error',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

const __dirname = path.dirname(new URL(import.meta.url).pathname);

try {
  app.register(fastifyWebsocket);

  // Load all plugins FIRST (especially auth plugin)
  await app.register(AutoLoad, {
    dir: path.join(__dirname, 'plugins'),
    dirNameRoutePrefix: false,
  });

  // Load all routes (used for API -> Socket communication)
  await app.register(AutoLoad, {
    dir: path.join(__dirname, 'routes'),
    dirNameRoutePrefix: true,
  });

  await app.listen({ port: env.SOCKET_PORT, host: '0.0.0.0' });

  console.info('🌐 Socket server started on port', env.SOCKET_PORT);

  // DEMO DEMO DEMO @michmos (temporary code to demonstrate API key usage)
  // Demo API call with the ADMIN_API_KEY

  // Timeout
  await new Promise((resolve) => setTimeout(resolve, 10000));
  console.log('📡 Making demo API call to fetch users with ADMIN_API_KEY');
  console.log('url :', `${env.API_URL}/user`);
  const response = await fetch(`${env.API_URL}/user`, {
    method: 'GET',
    headers: {
      'x-api-key': env.ADMIN_API_KEY,
    },
  });
  console.info('📡 Demo API call response status:', response.status);
  // Get response body as stream and log chunks
  const reader = response.body?.getReader();
  if (!reader) {
    console.error('❌ No response body');
    return;
  }

  const { value } = await reader.read();

  const users = JSON.parse(new TextDecoder().decode(value)) as unknown[];
  for (const user of users) {
    if (typeof user !== 'object' || user === null) continue;
    if (!('uuid' in user) || !('fullName' in user)) continue;
    console.info(`👤 User: ${user?.uuid} - ${user.fullName}`);
  }

  // DEMO DEMO DEMO @michmos (temporary code to demonstrate API key usage)
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
