import type { OAuthContext } from '../../index.js';
import type { OAuthProvider } from '../../index.js';

export interface AuthorizeUrlPayload {
  redirect_uri: string;
  scope: string;
  state: string;
  access_type: 'offline';
  prompt: 'consent select_account';
}

import ProviderUtility from '../providers/index.js';

function generateAuthUrl(
  ctx: OAuthContext,
  provider: OAuthProvider,
  ipNumber: string
): string {
  // Generate a unique state parameter for CSRF protection
  const state = {
    state: Math.random().toString(36).substring(2, 15),
    ipNumber: ipNumber,
    provider: provider,
    cli: true,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // Expires in 10 minutes
  };

  ctx.state.push(state);

  if (!provider.oauth2Client) {
    throw new Error('OAuth2 client not initialized for provider');
  }

  const payload: AuthorizeUrlPayload = {
    redirect_uri: ctx.redirectUri,
    scope: provider.scopes.join(' '),
    state: state.state,
    access_type: 'offline',
    prompt: 'consent select_account',
  };

  return provider.oauth2Client.authorizeURL(payload);
}

function setupLoginRoute(ctx: OAuthContext) {
  ctx.app.get(`/auth/login`, async (request, reply) => {
    const { provider: providerName, cli: cli } = request.query as {
      provider: string;
      cli?: string;
    };

    const provider = ProviderUtility.get(providerName);
    const ipNumber = request.ip;

    if (!provider) {
      return reply.status(400).send({ error: 'Unknown provider' });
    }

    request.log.info(`Generating ${provider.name} OAuth URL`);

    if (!provider.scopes || provider.scopes.length === 0) {
      throw new Error('No scopes defined for provider:' + provider.name);
    }

    // Generate the authorization URL
    const url = generateAuthUrl(ctx, provider, ipNumber);
    return reply.status(302).redirect(url);
  });
}

export default setupLoginRoute;
