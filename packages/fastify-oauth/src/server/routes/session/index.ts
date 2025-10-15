import type { OAuthContext } from '../../index.js';
import TokenUtility, { type SessionCookie } from '../../utils/token/index.js';
import ProviderUtility from '../providers/index.js';
import { getOauthUser, getUserUUID } from '../../utils/user/index.js';
import type { FastifyReply } from 'fastify';

class SessionManager {
  private ctx!: OAuthContext;

  constructor() {
    this.ctx = {} as OAuthContext;
  }

  initialize(ctx: OAuthContext) {
    this.ctx = ctx;
    this.initializeSessionRoute();
  }

  public userIsLoggedIn(session: string | undefined): SessionCookie | null {
    if (!session) return null;

    // Verify and decode the JWT token from the session cookie
    const decodedSession: SessionCookie | null =
      TokenUtility.verifySessionToken(session);

    // If no valid session, return false
    if (!decodedSession) return null;

    return decodedSession;
  }

  private logoutUser(reply: FastifyReply, error?: Error) {
    if (error) console.error(error.message);
    reply.clearCookie('session', { path: '/' }).status(200);
    return reply.status(200).send({ session: null });
  }

  private returnSession(reply: FastifyReply, session: SessionCookie) {
    reply.status(200).send(session);
  }

  // Endpoint to get the current session data
  private async initializeSessionRoute() {
    this.ctx.app.get('/auth/session', async (request, reply) => {
      const { session: sessionCookieValue } = request.cookies;

      // Verify and decode the JWT token from the session cookie
      const sessionCookie = TokenUtility.verifySessionToken(sessionCookieValue);
      if (!sessionCookie) return this.logoutUser(reply);

      // Get provider from session data
      const provider = ProviderUtility.get(sessionCookie.providerName);

      // If provider is not found, clear cookie and return null
      if (!provider || !provider.oauth2Client || !provider.scopes)
        return this.logoutUser(reply, new Error('Unknown provider'));

      // If the session is issued less than 60 seconds ago, return it as is
      const timeNow = new Date().getTime();
      if ((timeNow - sessionCookie.issuedAt) / 1000 < 60) {
        return this.returnSession(reply, sessionCookie);
      }

      // Generate a unique state parameter for CSRF protection
      const state = {
        state: Math.random().toString(36).substring(2, 15),
        ipNumber: request.ip,
        provider: provider,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // Expires in 10 minutes
      };

      this.ctx.state.push(state);
      // Create an access token object using the refresh token
      const accessToken = provider.oauth2Client.createToken({
        refresh_token: sessionCookie.refreshToken,
        scope: provider.scopes,
        redirect_uri: this.ctx.redirectUri,
        state: state.state,
      });

      if (!accessToken) {
        return this.logoutUser(
          reply,
          new Error('Failed to create access token')
        );
      }

      // Refresh the access token
      try {
        const refreshed = await accessToken.refresh({
          scope: provider.scopes,
        });

        if (!refreshed || !refreshed.token) {
          console.error(
            'Failed to refresh access token for provider:',
            provider.name
          );
          return reply
            .clearCookie('session', { path: '/' })
            .status(200)
            .send({ session: null });
        }

        // Merge the refreshed token data into the existing token object
        accessToken.token = {
          ...accessToken.token,
          ...refreshed.token,
        };

        // If the provider did not provide a refresh token, reuse the one from the session
        if (!accessToken.token.refresh_token) {
          accessToken.token.refresh_token = sessionCookie.refreshToken;
        }

        // If no access token, clear cookie and return null
        if (!accessToken.token.access_token) {
          console.error(
            'No access token available after refresh for provider:',
            provider.name
          );
          reply.clearCookie('session', { path: '/' });
          return reply.status(200).send({ session: null });
        }

        // Fetch the user info from the provider via the fetchUserData callback
        const user = await getOauthUser(
          provider,
          accessToken,
          sessionCookie.name
        );
        if (!user) {
          return reply.status(400).send({ error: 'Failed to fetch user info' });
        }

        // Generate a new JWT token with updated info
        const sessionJWT = TokenUtility.generateSessionToken({
          providerName: provider.name,
          name: sessionCookie.name,
          uuid: getUserUUID(user) || sessionCookie.uuid,
          refreshToken: accessToken.token.refresh_token as string,
          expiresAt: Date.parse(accessToken.token.expires_at as string),
          issuedAt: new Date().getTime(),
        });

        // Extract a unique user identifier
        const uuid = getUserUUID(user);

        if (!uuid) {
          return this.ctx.error(new Error('Failed to get user UUID'));
        }

        // Trigger userUpdate callback if registered
        if (this.ctx.callbacks['login']) {
          this.ctx.callbacks['login']({
            uuid,
            providerName: provider.name,
            user,
          });
        }

        const newSession = {
          provider: provider.name,
          user: user,
          uuid: uuid,
          accessToken: accessToken.token.access_token as string,
          expiresAt: Date.parse(accessToken.token.expires_at as string),
        };

        // Set JWT in HTTP-only cookie
        reply.setCookie('session', sessionJWT, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          path: '/',
        });

        // Return the session data
        return reply.status(200).send(newSession);
      } catch (error) {
        console.error('Error refreshing access token:', error);

        return reply
          .clearCookie('session', { path: '/' })
          .status(200)
          .send({ session: null });
      }
    });
  }
}

export default new SessionManager();
