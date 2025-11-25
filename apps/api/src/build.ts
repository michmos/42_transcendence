import path from 'path';
import AutoLoad from '@fastify/autoload';
import Fastify, {
  type FastifyError,
  type FastifyRequest,
  type FastifyReply,
} from 'fastify';
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

const errorHandler = (
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  let response: any = { message: error.message };
  const statusCode = error.statusCode || 500;

  if (error.validation) {
    response = {
      message: `Valiation error in ${error.validationContext}`,
      errors: error.validation,
    };
  }

  console.error(
    `Error occurred during request to ${request.url}: ${error.message}`
  );
  reply.status(statusCode).send(response);
};

export async function build(loadAuth = true) {
  console.info('⚙️  Auto-loading plugins and api routes...');

  // Load all plugins FIRST (especially auth plugin)
  await app.register(AutoLoad, {
    dir: path.join(__dirname, 'plugins'),
    dirNameRoutePrefix: false,
    ignoreFilter: (path) => path.includes('auth') && !loadAuth,
  });

  console.info('✅ Plugins loaded');

  await app.register(import('@fastify/multipart'), {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB max file size
    },
  });

  console.info('✅ Multipart loaded');

  app.setErrorHandler(errorHandler);

  // Load all API routes AFTER plugins
  await app.register(AutoLoad, {
    dir: path.join(__dirname, 'routes'),
    dirNameRoutePrefix: true,
  });

  console.info('✅ Routes loaded');
  return app;
}
