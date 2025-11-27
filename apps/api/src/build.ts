import path from 'path';
import AutoLoad from '@fastify/autoload';
import Fastify from 'fastify';
// import fastifyStatic from '@fastify/static';

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

export async function build(loadAuth = true) {
  // Load all plugins FIRST (especially auth plugin)
  await app.register(AutoLoad, {
    dir: path.join(__dirname, 'plugins'),
    dirNameRoutePrefix: false,
    ignoreFilter: (path) => path.includes('auth') && !loadAuth,
  });

  // TODO: Add this into the plugins folder as a separate plugin
  await app.register(import('@fastify/multipart'), {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB max file size
    },
  });

  console.info('✅ Multipart loaded');

  // await app.register(fastifyStatic, {
  //   root: path.join(process.cwd(), 'public'),
  //   prefix: '/',
  // });

  // console.info('✅ fastifyStatic loaded');

  // Load all API routes AFTER plugins
  await app.register(AutoLoad, {
    dir: path.join(__dirname, 'routes'),
    dirNameRoutePrefix: true,
  });

  console.info('✅ Routes loaded');
  return app;
}
