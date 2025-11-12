import path from 'path';
import AutoLoad from '@fastify/autoload';
import Fastify from 'fastify';
import { env } from './env.js';

import { Socket } from './plugins/websocket/index.js';

export async function build() {
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

  // Decorate app with hostname for easy access
  const hostname = `${env.HOST_NAME}:${env.HOST_PORT}`;
  app.decorate('hostname', hostname);

  // Fetch available authentication providers from the API server
  app.decorate('providers', [] as { name: string; buttonUri: string }[]);

  try {
    const response = await fetch(`http://${hostname}/api/auth/providers`, {
      method: 'GET',
    });
    if (response.status !== 200) {
    }

    const data = await response.json();
    const providersArray = Array.isArray(data) ? data : (data.providers ?? []);

    app.providers.splice(0, app.providers.length, ...providersArray);
  } catch (error: unknown) {
    console.error(`Failed to connect to server`, app.hostname, `Exiting...`);
    process.exit(0);
  }

  await app.register(AutoLoad, {
    dir: path.join(__dirname, 'plugins'),
    dirNameRoutePrefix: false,
  });

  // Initialize WebSocket connection
  const socket = new Socket(`ws://${hostname}/websocket`);
  app.decorate('socket', socket);

  return app;
}
