import type { OAuthContext } from '../../index.js';
import type { OAuthProvider } from '../../index.js';

export interface AuthorizeUrlPayload {
  redirect_uri: string;
  scope: string;
  access_type: 'offline';
  prompt: 'consent select_account';
}

import ProviderUtility from '../providers/index.js';

function countStatesWithIP(ctx: OAuthContext, ipNumber: string): number {
  return ctx.state.filter((s) => s.ipNumber === ipNumber).length;
}

async function generateAuthUrl(
  ctx: OAuthContext,
  provider: OAuthProvider,
  ipNumber: string
): Promise<string> {
  // Limit the number of concurrent states per IP to prevent abuse
  const maxStatesPerIP = 5;
  if (countStatesWithIP(ctx, ipNumber) >= maxStatesPerIP) {
    throw ctx.error(
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

  ctx.state.push(state);

  if (!provider.oauth2Client) {
    throw ctx.error(new Error('OAuth2 client not initialized for provider'));
  }

  return provider.oauth2Client.authorizeURL({
    redirect_uri: ctx.redirectUri,
    scope: provider.scopes.join(' '),
    state: state.state,
    access_type: 'offline',
    prompt: 'consent select_account',
  } as AuthorizeUrlPayload);
}

function setupLoginRoute(ctx: OAuthContext) {
  ctx.app.get(`/auth/login`, async (request, reply) => {
    const { provider: providerName } = request.query as { provider: string };
    const provider = ProviderUtility.get(providerName);
    const ipNumber = request.ip;

    if (!provider) {
      return reply.status(400).send({ error: 'Unknown provider' });
    }

    request.log.info(`Generating ${provider.name} OAuth URL`);

    if (!provider.scopes || provider.scopes.length === 0) {
      return ctx.error(
        new Error('No scopes defined for provider:' + provider.name),
        reply
      );
    }

    // Generate the authorization URL
    const url = await generateAuthUrl(ctx, provider, ipNumber);
    return reply.status(302).redirect(url);
  });
}

export default setupLoginRoute;
