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

import { type FastifyInstance } from 'fastify';
import { AuthorizationCode, type AccessToken } from 'simple-oauth2';

import jwt from 'jsonwebtoken';
import fastifyCookie from '@fastify/cookie';

interface UserType {
  email: string;
  name: string;
  picture: string;
}

interface SessionCookie {
  refreshToken: string;
  provider: string;
  user: UserType;
  expires_at: Date;
  access_token: string;
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
  redirectUri: string;
  buttonUri: string;
  oauth2Client: AuthorizationCode;
}

interface AuthorizeUrlPayload {
  redirect_uri: string;
  scope: string;
  access_type: 'offline';
  prompt: 'consent';
}

class OAuth {
  private app: FastifyInstance;
  private callbacks: Record<string, (args: unknown) => unknown>;
  private oAuthProviders: OAuthProvider[] = [];
  private redirectUri: string;
  private jwtSecret: string;

  constructor(app: FastifyInstance, redirectUri: string, jtwSecret: string) {
    this.callbacks = {};
    this.redirectUri = redirectUri;
    this.app = app;
    this.app.register(fastifyCookie);
    this.jwtSecret = jtwSecret;
    this.initialize();
  }

  private async getUserInformation(
    provider: OAuthProvider,
    accessToken: AccessToken
  ) {
    if (accessToken.token.id_token) {
      return this.decodeOpenId(accessToken.token.id_token as string);
    } else if (provider.name === '42') {
      return await this.getUserFrom42(accessToken.token.access_token as string);
    } else if (provider.name === 'github') {
      return await this.getUserFromGitHub(
        accessToken.token.access_token as string
      );
    }
  }

  private async generateJWTToken(
    user: UserType,
    refreshToken: string,
    name: string
  ) {
    // Create JWT token with the UUID and refresh token
    return jwt.sign(
      {
        ...user,
        provider: name,
        refreshToken,
      },
      this.jwtSecret
    );
  }
  // Decode user info from the ID token
  private decodeOpenId(idToken: string) {
    try {
      const decoded = jwt.decode(idToken);
      if (!decoded || typeof decoded !== 'object') {
        throw new Error('Invalid ID token structure');
      }
      return decoded as unknown as UserType;
    } catch (error) {
      throw new Error('Failed to decode ID token: ' + (error as Error).message);
    }
  }

  // Fetch user info from GitHub API
  private async getUserFromGitHub(token: string) {
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!userResponse.ok) {
      throw new Error(
        `Failed to fetch user info from GitHub API: ${userResponse.statusText}`
      );
    }

    const userData = await userResponse.json();

    // Get email from the user data or fetch primary email if not public
    if (!userData.email) {
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (emailResponse.ok) {
        const emails = await emailResponse.json();
        const primaryEmail = emails.find(
          (email: { primary: string; verified: string }) =>
            email.primary && email.verified
        );
        if (primaryEmail) {
          userData.email = primaryEmail.email;
        }
      }
    }
    return {
      email: userData.email,
      name: userData.name || userData.login,
      picture: userData.avatar_url,
    } as UserType;
  }

  // Fetch user info from 42 API
  private async getUserFrom42(token: string) {
    const userResponse = await fetch('https://api.intra.42.fr/v2/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error(
        `Failed to fetch user info from 42 API: ${userResponse.statusText}`
      );
    }

    const userData = await userResponse.json();
    return {
      email: userData.email,
      name: userData.usual_full_name,
      picture: userData.image.link,
    } as UserType;
  }

  private async generateAuthUrl(
    provider: OAuthProvider,
    scopes: string[]
  ): Promise<string> {
    // if (provider.name === '42') {
    //   return provider.oauth2Client.authorizeURL({
    //     redirect_uri: provider.redirectUri,
    //     scope: scopes.join(' '),
    //   } as authorizeUrlPayload);
    // }

    return provider.oauth2Client.authorizeURL({
      redirect_uri: provider.redirectUri,
      scope: scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
    } as AuthorizeUrlPayload);
  }

  addProvider(name: string, scopes: string[], options: OAuthProviderOptions) {
    console.info(`Adding OAuth provider: ${name}`);

    const provider = {
      name: name,
      scopes: scopes,
      oauth2Client: new AuthorizationCode(options),
      buttonUri: `api/auth/${name}/login`,
      redirectUri: this.redirectUri + name + '/callback',
    };

    this.oAuthProviders.push(provider);

    this.app.get(`/auth/${name}/login`, async (request, reply) => {
      request.log.info(`Generating ${name} OAuth URL`);

      // Send the authorization URL to the client as a JSON response
      reply.send({ url: await this.generateAuthUrl(provider, scopes) });
    });

    this.app.get(`/auth/${name}/callback`, async (request, reply) => {
      const { code } = request.query as { code: string };

      // Ensure the authorization code is present
      if (!code) {
        return reply
          .status(400)
          .send({ error: 'Authorization code not provided' });
      }

      // Exchange the authorization code for an access token
      const accessToken = await provider.oauth2Client.getToken({
        code,
        redirect_uri: provider.redirectUri,
        scope: scopes.join(' '),
      });

      console.log('Access Token:', accessToken.token);
      // Check if access token is present
      if (!accessToken) {
        return reply
          .status(400)
          .send({ error: 'Failed to obtain access token' });
      }

      const user = await this.getUserInformation(provider, accessToken);

      if (!user) {
        return reply.status(400).send({ error: 'Failed to fetch user info' });
      }
      // // TODO: Look up the user in your database and create a new user record if they don't exist.
      // // Lets do this with a callback in the server so the plugin is not dependent on the database structure

      const sessionJWT = await this.generateJWTToken(
        user,
        accessToken.token.refresh_token as string,
        provider.name
      );

      // Set JWT in HTTP-only cookie
      reply.setCookie('session', sessionJWT, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      });

      if (this.callbacks['userUpdated']) {
        this.callbacks['userUpdated']({ ...user, ...accessToken });
      }

      console.info(`OAuth successful for ${user.email}`);
      reply.redirect(`/`);
    });
    return this;
  }

  removeProvider(name: string) {
    this.oAuthProviders = this.oAuthProviders.filter(
      (provider: OAuthProvider) => provider.name !== name
    );
  }

  getProvider(name: string) {
    return this.oAuthProviders.find(
      (provider: OAuthProvider) => provider.name === name
    );
  }

  private initialize() {
    console.info('🔑 Registering Authentication Endpoint');

    this.app.get('/auth/providers', async (request, reply) => {
      reply.send({
        providers: this.oAuthProviders.map((provider) => ({
          name: provider.name,
          buttonUri: provider.buttonUri,
        })),
      });
    });

    this.app.get('/auth/session', async (request, reply) => {
      const { session } = request.cookies as { session?: string };
      if (!session) {
        return reply.status(200).send({ user: null });
      }

      const decodedSession = jwt.verify(
        session,
        this.jwtSecret
      ) as SessionCookie;

      // Get provider from decoded.provider
      const provider = this.getProvider(decodedSession.provider);
      if (!provider) {
        return reply.status(400).send({ error: 'Unknown provider' });
      }
      console.log('Decoded session:', decodedSession);
      if (!decodedSession.refreshToken) {
        return reply
          .status(400)
          .send({ error: 'Refresh token not found in JWT' });
      }

      // Refresh the access token using the refresh token
      const accessToken = provider.oauth2Client.createToken({
        refresh_token: decodedSession.refreshToken,
      });

      const refreshed = await accessToken.refresh({
        scope: provider.scopes.join(' '),
      });

      // Special to make sure we keep the old refresh token if none is returned by for example Google
      accessToken.token = { ...accessToken.token, ...refreshed.token };

      if (!accessToken.token.refresh_token) {
        accessToken.token.refresh_token = decodedSession.refreshToken;
      }

      if (!accessToken || !accessToken.token.access_token) {
        reply.clearCookie('session', { path: '/' });
        return reply.status(200).send({ user: null });
      }

      const user = await this.getUserInformation(provider, accessToken);
      if (!user) {
        return reply.status(400).send({ error: 'Failed to fetch user info' });
      }

      const sessionJWT = await this.generateJWTToken(
        user,
        accessToken.token.refresh_token as string,
        provider.name
      );

      // Set JWT in HTTP-only cookie
      reply.setCookie('session', sessionJWT, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      });

      return reply.status(200).send({ user });
    });

    // Logout endpoint to clear the session cookie
    this.app.get('/auth/logout', async (request, reply) => {
      reply.clearCookie('session', { path: '/' });
      // Make sure to refresh the frontend state as well
      return reply.status(200).send({ message: 'Logged out' });
    });
  }

  on(name: string, callback: (args: unknown) => unknown) {
    this.callbacks[name] = callback;
    return this;
  }
}

// Export a factory function that takes a FastifyInstance and returns a new OAuth instance
export default function Auth(
  app: FastifyInstance,
  redirectUri: string,
  jtwSecret: string
): OAuth {
  return new OAuth(app, redirectUri, jtwSecret);
}
