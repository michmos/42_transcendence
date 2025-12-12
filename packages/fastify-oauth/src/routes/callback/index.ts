import type { OAuthContext } from '../../index.js';
import type { SessionCookie } from '../../utils/token/index.js';
import { getOauthUser } from '../../utils/user/index.js';

import jwt from 'jsonwebtoken';

function setupCallbackRoute(ctx: OAuthContext) {
  ctx.app.get(`/auth/callback`, async (request, reply) => {
    // Get the provider based on the query parameter
    const state = (request.query as { state?: string }).state;

    // If state is present, it must match the provider name
    if (!state) {
      throw new Error('Invalid state parameter');
    }

    // Find and remove the state from the list to prevent reuse
    const stateIndex = ctx.state.findIndex((s) => s.state === state);
    if (stateIndex === -1) {
      throw new Error('Invalid or expired state parameter');
    }
    const [removedState] = ctx.state.splice(stateIndex, 1);

    if (!removedState || removedState.expiresAt < new Date()) {
      throw new Error('State parameter has expired, please try again.');
    }

    const provider = removedState.provider;
    const cli = removedState.cli;

    if (!provider) {
      throw new Error('Unknown provider:' + state);
    }

    // Ensure the authorization code is present
    const { code } = request.query as { code: string };
    if (!code) {
      throw new Error('Authorization code not provided');
    }

    if (!provider.oauth2Client || !provider.scopes) {
      throw new Error('OAuth2 client not initialized for provider');
    }

    console.log(`Handling callback for provider: ${provider.name}`);

    // Exchange the authorization code for an access token
    const accessToken = await provider.oauth2Client.getToken({
      code,
      redirect_uri: ctx.redirectUri,
      scope: provider.scopes,
    });

    // Check if access token is present
    if (!accessToken) {
      throw new Error('Failed to obtain access token from provider');
    }

    const oAuthUser = await getOauthUser(provider, accessToken);

    if (!oAuthUser) {
      throw new Error('Failed to fetch user info');
    }

    // Create session object to be stored in JWT
    const session: SessionCookie = {
      providerName: oAuthUser.providerName,
      name: oAuthUser.fullName,
      uuid: oAuthUser.uuid,
      refreshToken: accessToken.token.refresh_token as string,
      eat: Date.parse(accessToken.token.expires_at as string),
    };

    const sessionJWT = jwt.sign(session, ctx.jwtSecret);

    if (cli) {
      // For CLI, return the JWT directly in the response
      return reply.send(sessionJWT);
    }

    // Trigger userUpdate callback if registered
    if (ctx.callbacks['login']) {
      ctx.callbacks['login'](oAuthUser);
    }

    // Set JWT in HTTP-only cookie
    reply.setCookie('session', sessionJWT, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    reply.redirect(ctx.successRedirectUrl || '/');
  });
}

export default setupCallbackRoute;
