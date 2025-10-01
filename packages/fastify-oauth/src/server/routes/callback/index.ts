import type { OAuthContext } from '../../index.js';
import { getUser, getUserUUID, getUserName } from '../../utils/user/index.js';

import jwt from 'jsonwebtoken';

function setupCallbackRoute(ctx: OAuthContext) {
  ctx.app.get(`/callback`, async (request, reply) => {
    // Get the provider based on the query parameter
    const state = (request.query as { state?: string }).state;

    // If state is present, it must match the provider name
    if (!state) {
      return ctx.error(new Error('Invalid state parameter'), reply);
    }

    // Find and remove the state from the list to prevent reuse
    const stateIndex = ctx.state.findIndex((s) => s.state === state);
    if (stateIndex === -1) {
      return ctx.error(new Error('Invalid or expired state parameter'), reply);
    }
    const [removedState] = ctx.state.splice(stateIndex, 1);

    if (!removedState || removedState.expiresAt < new Date()) {
      return ctx.error(
        new Error('State parameter has expired, please try again.'),
        reply
      );
    }

    const provider = removedState.provider;
    if (!provider) {
      return ctx.error(new Error('Unknown provider:' + state), reply);
    }

    // Ensure the authorization code is present
    const { code } = request.query as { code: string };
    if (!code) {
      return ctx.error(new Error('Authorization code not provided'));
    }

    if (!provider.oauth2Client || !provider.scopes) {
      return ctx.error(new Error('OAuth2 client not initialized for provider'));
    }
    // Exchange the authorization code for an access token
    const accessToken = await provider.oauth2Client.getToken({
      code,
      redirect_uri: ctx.redirectUri,
      scope: provider.scopes,
    });

    // Check if access token is present
    if (!accessToken) {
      return ctx.error(new Error('Failed to obtain access token'));
    }

    const user = await getUser(provider, accessToken);

    if (!user) {
      return ctx.error(new Error('Failed to fetch user info during callback'));
    }

    // Extract a unique user identifier
    const uuid = getUserUUID(user);

    if (!uuid) {
      return ctx.error(new Error('Failed to get user UUID'));
    }

    const name = getUserName(user);

    // Trigger userUpdate callback if registered
    if (ctx.callbacks['login']) {
      ctx.callbacks['login']({
        uuid,
        name,
        providerName: provider.name,
        user,
      });
    }

    // Create session object to be stored in JWT
    const session = {
      providerName: provider.name,
      name,
      uuid,
      refreshToken: accessToken.token.refresh_token as string,
      expiresAt: Date.parse(accessToken.token.expires_at as string),
      issuedAt: new Date().getTime(),
    };

    const sessionJWT = jwt.sign(session, ctx.jwtSecret);

    // Set JWT in HTTP-only cookie
    reply.setCookie('session', sessionJWT, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    reply.redirect(ctx.loginSuccessRedirectUrl || '/');
  });
}

export default setupCallbackRoute;
