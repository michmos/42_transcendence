import { type FastifyInstance } from 'fastify';
import fastifyCookie from '@fastify/cookie';

import { AuthorizationCode, type AccessToken } from 'simple-oauth2';

declare module 'fastify' {
  interface FastifyRequest {
    user: {
      uuid: string;
      role: string;
    };
  }
}

import setupCallbackRoute from './routes/callback/index.js';
import setupLoginRoute from './routes/login/index.js';
import setupLogoutRoute from './routes/logout/index.js';

import SessionManager from './routes/session/index.js';
import ProviderUtility from './routes/providers/index.js';

import TokenUtility from './utils/token/index.js';

import { type oAuthUser } from './utils/user/index.js';

interface OAuthContext {
  app: FastifyInstance;
  redirectUri: string;
  successRedirectUrl: string;
  errorRedirectUrl: string;
  jwtSecret: string;
  state: State[];

  callbacks: Record<string, (args: unknown) => unknown>;
}

class OAuth {
  private ctx: OAuthContext;

  constructor(
    app: FastifyInstance,
    redirectUri: string,
    successRedirectUrl: string,
    errorRedirectUrl: string,
    jwtSecret: string
  ) {
    this.ctx = {
      app,
      redirectUri,
      successRedirectUrl,
      errorRedirectUrl,
      jwtSecret,
      state: [],
      callbacks: {},
    };
    ProviderUtility.initialize(this.ctx);
    SessionManager.initialize(this.ctx);
    TokenUtility.initialize(jwtSecret);

    this.initialize();
  }

  private removeExpiredStates() {
    const now = new Date();
    this.ctx.state = this.ctx.state.filter((s) => s.expiresAt > now);
  }

  // Initialize the authentication routes
  private initialize() {
    console.info('📦 Initializing Authentication Package');

    this.ctx.app.register(fastifyCookie);

    // Clean up expired states periodically
    setInterval(() => this.removeExpiredStates(), 10 * 60 * 1000); // Every 10 minutes

    // this.ctx.app.setErrorHandler(
    //   async (error: FastifyError, request, reply) => {
    //     // Check url to so it only responds to auth routes
    //     if (request.url.startsWith('/auth')) {
    //       reply.redirect(
    //         `/error?error=${encodeURIComponent(error.message)}&code=${500}`
    //       );
    //     }
    //   }
    // );

    setupCallbackRoute(this.ctx);
    setupLoginRoute(this.ctx);
    setupLogoutRoute(this.ctx);
  }

  // Register event callbacks

  public on(name: string, callback: (args: unknown) => unknown) {
    this.ctx.callbacks[name] = callback;
    return this;
  }

  // Add a new OAuth provider
  public addProvider(config: OAuthProviderOptions) {
    ProviderUtility.add(config);
    return this;
  }

  // Remove a provider by name
  public removeProvider(name: string) {
    ProviderUtility.remove(name);
    return this;
  }

  // Check authentication for incoming requests and populate request.user when valid
  private async checkAuthenticationHook(
    request: import('fastify').FastifyRequest,
    reply: import('fastify').FastifyReply,
    adminRole: string,
    api_admin_key: string,

    getUserRoleCallback: (uuid: string) => Promise<string | null>
  ) {
    const apiKey = request.headers['x-api-key'];

    if (apiKey && typeof apiKey === 'string') {
      console.info(
        '🔑 Checking API key authentication for request to',
        request.url
      );

      if (apiKey !== api_admin_key) {
        console.warn('Invalid API key provided for request to', request.url);
        return reply.status(401).send({ error: 'Invalid API key' });
      }

      // Populate request.user with a placeholder user object for API key authenticated requests
      request.user = {
        uuid: 'placeholder-uuid', // Placeholder UUID for API key users
        role: adminRole, // Placeholder role for API key users
      };
      return;
    } else {
      console.info(
        '🔒 Checking JWT session authentication for request to',
        request.url
      );

      // Check for a valid session cookie
      const session = SessionManager.decodeJWT(
        request.cookies.session as string
      );

      // If no valid session, respond with 401 Unauthorized
      if (!session) {
        console.warn(
          'No valid session found for request to',
          request.url,
          'from ip',
          request.ip
        );

        return reply
          .status(401)
          .send({ error: 'No valid session found, please log in' });
      }

      // Fetch the user object from the database using the provided callback
      const userRole = await getUserRoleCallback(session.uuid);
      console.info('Fetched user role for UUID', session.uuid, ':', userRole);
      if (!userRole)
        return reply.status(401).send({ error: 'User not found in database' });
      request.user = {
        uuid: session.uuid,
        role: userRole,
      };
    }
  }

  // Add an authentication hook to Fastify
  public registerAuthCallback(
    getUserObjectCallback: (uuid: string) => Promise<string | null>,
    api_admin_key: string,
    adminRole: string
  ) {
    console.info('🔒 Registering authentication callback hook');

    this.ctx.app.addHook('onRequest', async (request, reply) => {
      // Allow unauthenticated access to the login routes
      if (request.url.startsWith('/auth')) {
        console.info('🔓 Allowing unauthenticated access to', request.url);
        return;
      }

      // Prevent overriding request.user
      if (request.user) {
        console.error('Someone is trying to override request.user!');
        return reply.status(400).send({ error: 'Bad Request' });
      }

      // Check authentication
      return await this.checkAuthenticationHook(
        request,
        reply,
        adminRole,
        api_admin_key,
        getUserObjectCallback
      );
    });
    return this;
  }
}

// Export a factory function that takes a FastifyInstance and returns a new OAuth instance
export default function Auth(
  app: FastifyInstance,
  redirectUri: string,
  successRedirectUrl: string,
  errorRedirectUrl: string,
  jwtSecret: string
): OAuth {
  return new OAuth(
    app,
    redirectUri,
    successRedirectUrl,
    errorRedirectUrl,
    jwtSecret
  );
}

export { type OAuthContext, type AccessToken, OAuth };

export interface OAuthProvider {
  name: string;
  scopes: string[];
  buttonUri: string;
  oauth2Client?: AuthorizationCode;
  fetchUserData?:
    | ((token: string) => Promise<Record<string, unknown>>)
    | undefined;
}

export interface OAuthProviderOptions {
  name: string;
  client: {
    id: string;
    secret: string;
  };
  auth: {
    tokenHost: string;
    tokenPath: string;
    authorizePath: string;
  };
  scopes: string[];

  fetchUserData?: (token: string) => Promise<Record<string, unknown>>;
}

export interface State {
  state: string;
  ipNumber: string;
  provider: OAuthProvider;
  cli: boolean;
  createdAt: Date;
  expiresAt: Date;
}

export { GitHub } from './utils/github/index.js';
export { FortyTwo } from './utils/fortytwo/index.js';
export { Google } from './utils/google/index.js';
export { SessionManager, type oAuthUser };
