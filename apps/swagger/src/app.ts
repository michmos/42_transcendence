import { env } from './env.js';
import { build } from './build.js';
import { type FastifyInstance } from 'fastify';

const start = async () => {
  const app: FastifyInstance = await build();
  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });

    console.info('🌐 API server started on port', env.PORT, 'with cors url');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
