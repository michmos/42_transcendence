import { env } from './env.js';

import path from 'path';
import AutoLoad from '@fastify/autoload';
import Fastify from 'fastify';

const app = Fastify({ logger: { level: 'error' } });

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const start = async () => {
  try {
    console.info('⚙️  Auto-loading plugins and api routes...');

    // Load all plugins FIRST (especially auth plugin)
    await app.register(AutoLoad, {
      dir: path.join(__dirname, 'plugins'),
      dirNameRoutePrefix: false,
    });

    console.info('✅ Plugins loaded');

    // Load all API routes AFTER plugins
    await app.register(AutoLoad, {
      dir: path.join(__dirname, 'routes'),
      dirNameRoutePrefix: true,
    });

    console.info('✅ Routes loaded');

    await app.listen({ port: env.API_PORT, host: '0.0.0.0' });

    console.info(
      '🌐 API server started on port',
      env.API_PORT,
      'with cors url',
      env.API_URL
    );
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
