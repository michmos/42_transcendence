import { env } from './env.js';

import path from 'path';
import AutoLoad from '@fastify/autoload';
import Fastify from 'fastify';

const app = Fastify({ logger: { level: 'info' } });

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const start = async () => {

    try {

        console.info('⚙️  Auto-loading plugins and routes...');
        // Load all plugins defined in plugins
        app.register(AutoLoad, {
            dir: path.join(__dirname, 'server/plugins'),
            dirNameRoutePrefix: true,
            indexPattern: /^no$/i,
        })

        // Load all routes defined in routes
        app.register(AutoLoad, {
            // dirNameRoutePrefix: true,
            dir: path.join(__dirname, 'routes'),
        });

        // API root route
        app.register(AutoLoad, {
            dir: path.join(__dirname, 'server'),
            dirNameRoutePrefix: true,
        });

        await app.listen({ port: env.API_PORT });

        console.info('🌐 Server started on port', env.API_PORT, 'with cors url', env.API_URL)
        
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();
    

