import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
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

console.log('Process cwd', process.cwd());

export async function build() {
  await app.register(fastifyStatic, {
    root: env.CDN_PATH,
    prefix: '/',
  });

  return app;
}
