import { env } from './env.js';

import path from 'path';
import AutoLoad from '@fastify/autoload';
import Fastify from 'fastify';

import googleAuthPlugin from './plugins/auth/index.js';

const app = Fastify({ logger: { level: 'info' } });

const __dirname = path.dirname(new URL(import.meta.url).pathname);

function updateUser(user: unknown) {
  // Placeholder function to update user in the database
  console.log('Updating user:', user);
}

const start = async () => {
  try {
    console.info('⚙️  Auto-loading plugins and api routes...');

    // // Load all plugins defined in plugins
    // app.register(AutoLoad, {
    //   dir: path.join(__dirname, 'plugins'),
    //   dirNameRoutePrefix: true,
    //   indexPattern: /^no$/i,
    // });

    // Register the googleAuthPlugin and handle user updates via event or callback if supported
    googleAuthPlugin(app, env.REDIRECT_URL, env.JWT_SECRET)
      .addProvider('google', ['openid', 'profile', 'email'], {
        client: {
          id: env.GOOGLE_CLIENT_ID,
          secret: env.GOOGLE_CLIENT_SECRET,
        },
        auth: {
          tokenHost: 'https://oauth2.googleapis.com',
          tokenPath: '/token',
          authorizePath: 'https://accounts.google.com/o/oauth2/v2/auth',
        },
      })
      .addProvider('42', ['public'], {
        client: {
          id: env.FORTYTWO_CLIENT_ID,
          secret: env.FORTYTWO_CLIENT_SECRET,
        },
        auth: {
          tokenHost: 'https://api.intra.42.fr',
          tokenPath: '/oauth/token',
          authorizePath: 'https://api.intra.42.fr/oauth/authorize',
        },
      })
      .addProvider('github', ['read:user', 'user:email', 'offline_access'], {
        client: {
          id: env.GITHUB_CLIENT_ID,
          secret: env.GITHUB_CLIENT_SECRET,
        },
        auth: {
          tokenHost: 'https://github.com',
          tokenPath: '/login/oauth/access_token',
          authorizePath: '/login/oauth/authorize',
        },
      })
      .on('userUpdated', updateUser)
      .on('error', (err) => {
        console.error('Error in auth plugin:', err);
      });

    // Load all API routes defined in routes
    app.register(AutoLoad, {
      dir: path.join(__dirname, 'routes'),
      dirNameRoutePrefix: true,
    });

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
