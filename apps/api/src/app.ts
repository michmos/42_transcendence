import { env } from './env.js';

import path from 'path';
import AutoLoad from '@fastify/autoload';
import Fastify from 'fastify';

import Auth from 'auth/backend';
import {
  fetchGithubUser,
  fetch42User,
  type OpenID,
  type GithubUser,
  type FourtyTwoUser,
} from 'auth/utils';

import database from 'db';

const app = Fastify({ logger: { level: 'info' } });

const __dirname = path.dirname(new URL(import.meta.url).pathname);

function updateUser(
  uuid: string,
  providerName: string,
  user: OpenID | GithubUser | FourtyTwoUser
) {
  console.log('Updating user:', uuid, user);
  database.upsertUser({
    uuid: uuid.toString(),
    // provider,
    email: (user as OpenID).email || (user as GithubUser).email || '',
    username:
      (user as OpenID).name ||
      (user as FourtyTwoUser).first_name +
        ' ' +
        (user as FourtyTwoUser).last_name ||
      'Unknown User' + Math.floor(Math.random() * 1000),
    avatar:
      (user as OpenID).picture ||
      (user as GithubUser).avatar_url ||
      (user as FourtyTwoUser).image.link ||
      '',
  });
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

    // Register the AuthPlugin and handle user updates via event or callback if supported
    function setupAuth(app: Fastify.FastifyInstance) {
      return Auth(app, env.REDIRECT_URL, '/', env.JWT_SECRET)
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
        .addProvider(
          '42',
          ['public'],
          {
            client: {
              id: env.FORTYTWO_CLIENT_ID,
              secret: env.FORTYTWO_CLIENT_SECRET,
            },
            auth: {
              tokenHost: 'https://api.intra.42.fr',
              tokenPath: '/oauth/token',
              authorizePath: 'https://api.intra.42.fr/oauth/authorize',
            },
          },
          (token: string) =>
            fetch42User(token) as unknown as Promise<Record<string, unknown>>
        )
        .addProvider(
          'github',
          ['read:user', 'user:email', 'offline_access'],
          {
            client: {
              id: env.GITHUB_CLIENT_ID,
              secret: env.GITHUB_CLIENT_SECRET,
            },
            auth: {
              tokenHost: 'https://github.com',
              tokenPath: '/login/oauth/access_token',
              authorizePath: '/login/oauth/authorize',
            },
          },
          (token: string) =>
            fetchGithubUser(token) as unknown as Promise<
              Record<string, unknown>
            >
        )
        .on('userUpdate', (args: unknown) => {
          const { uuid, providerName, user } = args as {
            uuid: string;
            providerName: string;
            user: OpenID | GithubUser | FourtyTwoUser;
          };
          updateUser(uuid, providerName, user);
        })
        .on('error', (err: unknown) => {
          console.error('Error in auth plugin:', err);
          // redirect to 404 page or show error message
        });
    }

    // Usage:
    setupAuth(app);

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
