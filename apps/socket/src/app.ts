import { env } from './env.js';

import path from 'path';
import AutoLoad from '@fastify/autoload';
import Fastify from 'fastify';

const app = Fastify({ logger: { level: 'info' } });

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const start = async () => {
  try {
    console.info('⚙️  Auto-loading plugins...');
    // Load all plugins defined in plugins
    app.register(AutoLoad, {
      dir: path.join(__dirname, 'plugins'),
      dirNameRoutePrefix: true,
      indexPattern: /^no$/i,
    });

    console.info(
      '🔧 Socket server binding to host: 0.0.0.0 port:',
      env.SOCKET_PORT
    );
    await app.listen({ port: env.SOCKET_PORT, host: '0.0.0.0' });

    console.info(
      '🌐 Socket server started on port',
      env.SOCKET_PORT,
      'with cors url',
      env.SOCKET_URL
    );
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
