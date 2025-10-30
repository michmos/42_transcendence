/**
 * To use OAuth2 authentication, we need access to a CLIENT_ID, CLIENT_SECRET, AND REDIRECT_URI.
 * To get these credentials for your application, visit https://console.cloud.google.com/apis/credentials.
 *
 * Make sure the people API is enabled for your project to get the user profile information.
 * You can enable it from https://console.cloud.google.com/apis/library/people.googleapis.com
 *
 * The REDIRECT_URI is the URL to which users will be redirected after they have authenticated with Google.
 * This URL must be registered in the Google Cloud Console.
 * For development purposes, you can use http://localhost:3000/api/auth/google/callback
 * For production, use your actual domain, e.g., https://yourdomain.com/api/auth/google/callback
 *
 * Make sure the Application is set to production or add test users if it's in testing mode.
 *
 * The JWT_SECRET is used to sign the JWT tokens. Make sure to use a strong, random string in a production environment.
 *
 * The GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URL, JWT_SECRET, should be set in your environment variables.
 *
 */

import { type FastifyInstance, type FastifyReply } from 'fastify';
import fastifyCookie from '@fastify/cookie';

import { AuthorizationCode, type AccessToken } from 'simple-oauth2';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      uuid: string;
      email: string;
      username?: string;
      avatar?: string;
      role?: string;
    };
  }
}

import setupCallbackRoute from './routes/callback/index.js';
import setupLoginRoute from './routes/login/index.js';
import setupLogoutRoute from './routes/logout/index.js';

import SessionManager from './routes/session/index.js';
import ProviderUtility from './routes/providers/index.js';

import TokenUtility from './utils/token/index.js';

interface OAuthContext {
  app: FastifyInstance;
  redirectUri: string;
  loginSuccessRedirectUrl: string;
  jwtSecret: string;
  state: State[];
  error: (err: Error, reply?: FastifyReply) => void;
  callbacks: Record<string, (args: unknown) => unknown>;
}

class OAuth {
  private ctx: OAuthContext;

  constructor(
    app: FastifyInstance,
    redirectUri: string,
    loginSuccessRedirectUrl: string,
    jwtSecret: string
  ) {
    this.ctx = {
      app,
      redirectUri,
      loginSuccessRedirectUrl,
      jwtSecret,
      state: [],
      error: this.error.bind(this),
      callbacks: {},
    };
    ProviderUtility.initialize(this.ctx);
    SessionManager.initialize(this.ctx);
    TokenUtility.initialize(jwtSecret);

    this.initialize();
  }

  private error(this: OAuth, err: Error, reply?: FastifyReply) {
    const jsonError = { status: 404, message: err.message, stack: err.stack };
    if (reply) reply.status(400).send({ error: jsonError });

    if (this.ctx.callbacks['error']) {
      return this.ctx.callbacks['error'](err);
    }
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
    setInterval(() => this.removeExpiredStates(), 1 * 60 * 1000); // Every 1 minutes

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
  public add(config: OAuthProviderOptions) {
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
    getUserCallback: (uuid: string) => unknown | null
  ) {
    // Allow unauthenticated access to the login routes
    if (request.url.startsWith('/auth')) return;

    console.info('🔒 Checking authentication for request to', request.url);

    // Check for a valid session cookie
    const session = SessionManager.decodeJWT(request.cookies.session as string);

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
    const userObj = await getUserCallback(session.uuid);
    if (!userObj)
      return reply.status(401).send({ error: 'User not found in database' });
    request.user = userObj as {
      uuid: string;
      email: string;
      username?: string;
      avatar?: string;
      role?: string;
    };
  }

  // Add an authentication hook to Fastify
  public addAuthenticationHook(
    getUserObjectCallback: (uuid: string) => Promise<unknown | null>
  ) {
    console.info('🔒 Adding authentication hook to Fastify');

    this.ctx.app.addHook('onRequest', (request, reply) =>
      this.checkAuthenticationHook(request, reply, getUserObjectCallback)
    );
    return this;
  }
}

// Export a factory function that takes a FastifyInstance and returns a new OAuth instance
export default function Auth(
  app: FastifyInstance,
  redirectUri: string,
  loginSuccessRedirectUrl: string,
  jwtSecret: string
): OAuth {
  return new OAuth(app, redirectUri, loginSuccessRedirectUrl, jwtSecret);
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
  createdAt: Date;
  expiresAt: Date;
}

export { GitHub } from './utils/github/index.js';
export { FortyTwo } from './utils/fortytwo/index.js';
export { Google } from './utils/google/index.js';
export { SessionManager };
