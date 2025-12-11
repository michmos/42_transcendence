import { env } from './env.js';
import { build } from './build.js';
import { type FastifyInstance } from 'fastify';

const app: FastifyInstance = await build();

try {
  await app.listen({ port: env.SWAGGER_PORT });

  console.info('🌐 Swagger server started on port', env.SWAGGER_PORT);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
