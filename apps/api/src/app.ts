import { env } from './env.js';
import { build } from './build.js';
import { type FastifyInstance } from 'fastify';

const start = async () => {
  const app: FastifyInstance = await build();
  try {
    await app.listen({ port: env.API_PORT });

    console.info(
      '🌐 API server started on port',
      env.API_PORT,
      'with cors url'
    );
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
