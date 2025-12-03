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

const start = async () => {
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
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

await start();
