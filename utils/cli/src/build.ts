import path from 'path';
import AutoLoad from '@fastify/autoload';
import Fastify from 'fastify';

const isDevelopment = process.env.NODE_ENV !== 'production';

export async function build() {
  const app = Fastify({
    logger: isDevelopment
      ? {
          level: 'error',
          transport: {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          },
        }
      : {
          level: 'error',
        },
  });

  const __dirname = path.dirname(new URL(import.meta.url).pathname);

  await app.register(AutoLoad, {
    dir: path.join(__dirname, 'plugins'),
    dirNameRoutePrefix: false,
  });

  return app;
}
