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
 * The FRONTEND_URL is the URL of your frontend application where users will be redirected after successful authentication.
 *
 * The GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URL, JWT_SECRET, and FRONTEND_URL should be set in your environment variables.
 *
 */

import { type FastifyInstance, type FastifyReply } from 'fastify';
import { AuthorizationCode, type AccessToken } from 'simple-oauth2';

import jwt from 'jsonwebtoken';
import fastifyCookie from '@fastify/cookie';

interface SessionCookie {
  providerName: string;
  userUUID: string;
  refreshToken: string;
  expires_at: Date;
}

interface OAuthProviderOptions {
  client: {
    id: string;
    secret: string;
  };
  auth: {
    tokenHost: string;
    tokenPath: string;
    authorizePath: string;
  };
}

interface OAuthProvider {
  name: string;
  scopes: string[];
  buttonUri: string;
  oauth2Client: AuthorizationCode;
  fetchUserData:
    | ((token: string) => Promise<Record<string, unknown>>)
    | undefined;
}

interface AuthorizeUrlPayload {
  redirect_uri: string;
  scope: string;
  access_type: 'offline';
  prompt: 'consent';
}

interface State {
  state: string;
  ipNumber: string;
  provider: OAuthProvider;
  createdAt: Date;
  expiresAt: Date;
}

class OAuth {
  private app: FastifyInstance;
  private callbacks: Record<string, (args: unknown) => unknown>;
  private oAuthProviders: OAuthProvider[] = [];
  private redirectUri: string;
  private loginSuccessRedirectUrl: string;
  private jwtSecret: string;
  private state: State[] = [];

  constructor(
    app: FastifyInstance,
    redirectUri: string,
    loginSuccessRedirectUrl: string,
    jtwSecret: string
  ) {
    this.app = app;
    this.redirectUri = redirectUri;
    this.loginSuccessRedirectUrl = loginSuccessRedirectUrl;
    this.jwtSecret = jtwSecret;
    this.callbacks = {};
    this.initialize();
  }

  private decodeIdToken(idToken: string) {
    try {
      const decoded = jwt.decode(idToken) as Record<string, unknown> | null;
      if (!decoded || typeof decoded !== 'object') {
        throw new Error('Invalid ID token structure');
      }
      return decoded;
    } catch (error) {
      throw new Error('Failed to decode ID token: ' + (error as Error).message);
    }
  }

  private removeExpiredStates() {
    const now = new Date();
    this.state = this.state.filter((s) => s.expiresAt > now);
  }

  private async getUser(provider: OAuthProvider, accessToken: AccessToken) {
    if (accessToken.token.id_token) {
      return this.decodeIdToken(accessToken.token.id_token as string);
    }
    if (!provider.fetchUserData) {
      throw this.error(
        new Error('No fetchUserData function defined for provider')
      );
    }
    return provider.fetchUserData(accessToken.token.access_token as string);
  }

  private async generateJWTToken(session: SessionCookie): Promise<string> {
    // Create JWT token with the UUID and refresh token
    return jwt.sign(session, this.jwtSecret);
  }

  private countStatesWithIP(ipNumber: string): number {
    return this.state.filter((s) => s.ipNumber === ipNumber).length;
  }

  private async generateAuthUrl(
    provider: OAuthProvider,
    scopes: string[],
    ipNumber: string
  ): Promise<string> {
    // Limit the number of concurrent states per IP to prevent abuse
    const maxStatesPerIP = 5;
    if (this.countStatesWithIP(ipNumber) >= maxStatesPerIP) {
      throw this.error(
        new Error('Too many concurrent authentication attempts from this IP')
      );
    }

    // Generate a unique state parameter for CSRF protection
    const state = {
      state: Math.random().toString(36).substring(2, 15),
      ipNumber: ipNumber,
      provider: provider,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // Expires in 10 minutes
    };

    this.state.push(state);

    return provider.oauth2Client.authorizeURL({
      redirect_uri: this.redirectUri,
      scope: scopes.join(' '),
      state: state.state,
      access_type: 'offline',
      prompt: 'consent',
    } as AuthorizeUrlPayload);
  }

  private error(err: Error, reply?: FastifyReply) {
    console.error('OAuth Error:', err);

    const jsonError = { message: err.message, stack: err.stack };
    if (reply) reply.redirect('/404').send({ error: jsonError });

    if (this.callbacks['error']) {
      return this.callbacks['error'](err);
    }
  }

  // Initialize the authentication routes
  private initialize() {
    console.info('🔑 Registering Authentication Endpoint');

    this.app.register(fastifyCookie);

    // Clean up expired states periodically
    setInterval(() => this.removeExpiredStates(), 1 * 60 * 1000); // Every 1 minutes

    this.app.get(`/auth/login`, async (request, reply) => {
      const { provider: providerName } = request.query as { provider: string };
      const provider = this.getProvider(providerName);
      const ipNumber = request.ip;

      if (!provider) {
        return this.error(new Error('Unknown provider:' + providerName), reply);
      }

      request.log.info(`Generating ${provider.name} OAuth URL`);

      const url = await this.generateAuthUrl(
        provider,
        provider.scopes,
        ipNumber
      );
      return reply.redirect(url);
    });

    this.app.get(`/auth/callback`, async (request, reply) => {
      // Get the provider based on the query parameter
      const state = (request.query as { state?: string }).state;

      // If state is present, it must match the provider name
      if (!state) {
        return this.error(new Error('Invalid state parameter'), reply);
      }

      // Find and remove the state from the list to prevent reuse
      const stateIndex = this.state.findIndex((s) => s.state === state);
      if (stateIndex === -1) {
        return this.error(
          new Error('Invalid or expired state parameter'),
          reply
        );
      }
      const [removedState] = this.state.splice(stateIndex, 1);

      if (!removedState || removedState.expiresAt < new Date()) {
        return this.error(
          new Error('State parameter has expired, please try again.'),
          reply
        );
      }

      const provider = removedState.provider;
      if (!provider) {
        return this.error(new Error('Unknown provider:' + state), reply);
      }

      // Ensure the authorization code is present
      const { code } = request.query as { code: string };
      if (!code) {
        return this.error(new Error('Authorization code not provided'));
      }

      // Exchange the authorization code for an access token
      const accessToken = await provider.oauth2Client.getToken({
        code,
        redirect_uri: this.redirectUri,
        scope: provider.scopes.join(' '),
      });

      // Check if access token is present
      if (!accessToken) {
        return this.error(new Error('Failed to obtain access token'));
      }

      const user = await this.getUser(provider, accessToken);

      if (!user) {
        return this.error(new Error('Failed to fetch user info'));
      }

      // Extract a unique user identifier
      const uuid = this.getUserUUID(user);

      if (!uuid) {
        return this.error(new Error('Failed to get user UUID'));
      }

      // Trigger userUpdate callback if registered
      if (this.callbacks['userUpdate']) {
        this.callbacks['userUpdate']({
          uuid,
          providerName: provider.name,
          user,
        });
      }

      // Create session object to be stored in JWT
      const session = {
        providerName: provider.name,
        userUUID: uuid,
        refreshToken: accessToken.token.refresh_token as string,
        expires_at: accessToken.token.expires_at as Date,
      };

      const sessionJWT = await this.generateJWTToken(session);

      // Set JWT in HTTP-only cookie
      reply.setCookie('session', sessionJWT, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      });

      reply.redirect(this.loginSuccessRedirectUrl || '/');
    });

    // Endpoint to get the current session data
    this.app.get('/auth/session', async (request, reply) => {
      const { session } = request.cookies as { session?: string };

      // If no session cookie, return null
      if (!session) {
        return reply.status(200).send({ session: null });
      }

      // Verify and decode the JWT token
      const decodedSession = jwt.verify(
        session,
        this.jwtSecret
      ) as SessionCookie;

      // Get provider from decoded.provider
      const provider = this.getProvider(decodedSession.providerName);

      // If provider not found or no refresh token, clear cookie and return null
      if (!provider || !decodedSession.refreshToken) {
        reply.clearCookie('session', { path: '/' });
        return reply.status(200).send({ session: null });
      }

      // Refresh the access token using the refresh token
      const accessToken = provider.oauth2Client.createToken({
        refresh_token: decodedSession.refreshToken,
      });

      // If token creation failed, clear cookie and return null
      if (!accessToken) {
        return this.error(
          new Error('Failed to authenticate with' + provider.name),
          reply
        );
      }

      // Refresh the access token
      const refreshed = await accessToken.refresh({
        scope: provider.scopes.join(' '),
      });

      // Merge the refreshed token data into the existing token object
      accessToken.token = { ...accessToken.token, ...refreshed.token };

      // If the provider did not provide a refresh token, reuse the one from the session
      if (!accessToken.token.refresh_token) {
        accessToken.token.refresh_token = decodedSession.refreshToken;
      }

      // If no access token, clear cookie and return null
      if (!accessToken || !accessToken.token.access_token) {
        reply.clearCookie('session', { path: '/' });
        return reply.status(200).send({ session: null });
      }

      // Fetch the user info from the provider via the fetchUserData callback
      const user = await this.getUser(provider, accessToken);
      if (!user) {
        return reply.status(400).send({ error: 'Failed to fetch user info' });
      }

      // Generate a new JWT token with updated info
      const sessionJWT = await this.generateJWTToken({
        providerName: provider.name,
        userUUID:
          typeof user === 'object' && user !== null
            ? (user['sub'] as string) ||
              (user['id'] as string) ||
              (user['email'] as string) ||
              ''
            : '',
        refreshToken: accessToken.token.refresh_token as string,
        expires_at: accessToken.token.expires_at as Date,
      });

      // Extract a unique user identifier
      const uuid = this.getUserUUID(user);

      if (!uuid) {
        return this.error(new Error('Failed to get user UUID'));
      }

      // Trigger userUpdate callback if registered
      if (this.callbacks['userUpdate']) {
        this.callbacks['userUpdate']({
          uuid,
          providerName: provider.name,
          user,
        });
      }

      const newSession = {
        provider: provider.name,
        user: user,
        accessToken: accessToken.token.access_token as string,
        expiresAt:
          accessToken.token.expires_at instanceof Date
            ? accessToken.token.expires_at.toISOString()
            : accessToken.token.expires_at,
      };

      // Set JWT in HTTP-only cookie
      reply.setCookie('session', sessionJWT, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      });

      // Return the session data
      return reply.status(200).send(newSession);
    });

    // Logout endpoint to clear the session cookie
    this.app.get('/auth/logout', async (request, reply) => {
      reply.clearCookie('session', { path: '/' });
      // Make sure to refresh the frontend state as well
      return reply.status(200).send({ message: 'Logged out' });
    });

    // Endpoint to list available OAuth providers
    this.app.get('/auth/providers', async (request, reply) => {
      reply.send({
        providers: this.oAuthProviders.map((provider) => ({
          name: provider.name,
          buttonUri: provider.buttonUri,
        })),
      });
    });
  }

  // Register event callbacks
  public on(name: string, callback: (args: unknown) => unknown) {
    this.callbacks[name] = callback;
    return this;
  }

  private getUserUUID(user: Record<string, unknown>): string | null {
    if ('sub' in user) {
      return user['sub'] as string;
    } else if ('id' in user) {
      return user['id'] as string;
    } else if ('email' in user) {
      return user['email'] as string;
    }
    return null;
  }

  // Add a new OAuth provider
  public addProvider(
    name: string,
    scopes: string[],
    options: OAuthProviderOptions,
    fetchUserData?: (token: string) => Promise<Record<string, unknown>>
  ) {
    console.info(`Adding OAuth provider: ${name}`);

    if (this.getProvider(name)) {
      this.error(new Error('Provider already exists: ' + name));
      return this;
    }

    // Create the OAuth2 client
    const provider = {
      name: name,
      scopes: scopes,
      oauth2Client: new AuthorizationCode(options),
      buttonUri: `api/auth/login?provider=${name}`,
      fetchUserData: fetchUserData,
    };

    this.oAuthProviders.push(provider);
    return this;
  }

  // Remove a provider by name
  public removeProvider(name: string) {
    this.oAuthProviders = this.oAuthProviders.filter(
      (provider: OAuthProvider) => provider.name !== name
    );
    return this;
  }

  // Get provider by name
  private getProvider(name: string) {
    return this.oAuthProviders.find(
      (provider: OAuthProvider) => provider.name === name
    );
  }
}

// Export a factory function that takes a FastifyInstance and returns a new OAuth instance
export default function Auth(
  app: FastifyInstance,
  redirectUri: string,
  loginSuccessRedirectUrl: string,
  jtwSecret: string
): OAuth {
  return new OAuth(app, redirectUri, loginSuccessRedirectUrl, jtwSecret);
}
