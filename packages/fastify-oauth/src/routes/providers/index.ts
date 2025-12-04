import type { OAuthContext, OAuthProviderOptions } from '../../index.js';
import type { OAuthProvider } from '../../index.js';
import { AuthorizationCode } from 'simple-oauth2';

class ProviderUtility {
  private oAuthProviders: OAuthProvider[];
  private ctx: OAuthContext;

  constructor() {
    this.oAuthProviders = [];
    this.ctx = {} as unknown as OAuthContext;
  }

  initialize(ctx: OAuthContext) {
    this.ctx = ctx;

    this.ctx.app.get('/auth/providers', async (request, reply) => {
      return reply.status(200).send({
        providers: this.oAuthProviders.map((provider) => ({
          name: provider.name,
          buttonUri: provider.buttonUri,
        })),
      });
    });
  }

  add(config: OAuthProviderOptions) {
    if (this.get(config.name)) {
      throw new Error('Provider already exists: ' + config.name);
    }

    if (!config.client || !config.client.id || !config.client.secret) {
      throw new Error(
        'Invalid client configuration for provider: ' + config.name
      );
    }
    if (
      !config.auth ||
      !config.auth.tokenHost ||
      !config.auth.tokenPath ||
      !config.auth.authorizePath
    ) {
      throw new Error(
        'Invalid auth configuration for provider: ' + config.name
      );
    }
    console.info('🔑 Adding OAuth provider:', config.name);
    const provider: OAuthProvider = {
      name: config.name,
      scopes: config.scopes || [],
      oauth2Client: new AuthorizationCode({
        client: config.client,
        auth: config.auth,
      }),

      buttonUri: `api/auth/login?provider=${config.name}`,
      fetchUserData: config.fetchUserData,
    };
    this.oAuthProviders.push(provider);
  }

  remove(name: string) {
    this.oAuthProviders = this.oAuthProviders.filter(
      (provider) => provider.name !== name
    );
  }

  get(name: string) {
    return this.oAuthProviders.find((provider) => provider.name === name);
  }
}

export default new ProviderUtility();
