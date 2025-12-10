import { env } from './env.js';
import { build } from './build.js';
import { type FastifyInstance } from 'fastify';

const start = async () => {
  const app: FastifyInstance = await build();
  try {
    await app.listen({ port: env.CDN_PORT, host: '0.0.0.0' });

    console.info('🌐 CDN server started on port', env.CDN_PORT);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
