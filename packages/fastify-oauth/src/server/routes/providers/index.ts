import type { OAuthContext } from '../../index.js';
import type { OAuthProvider } from '../../index.js';

class ProviderUtility {
  private oAuthProviders: OAuthProvider[];
  private ctx: OAuthContext;

  constructor() {
    console.info('Initializing Provider Utility');
    this.oAuthProviders = [];
    this.ctx = {} as OAuthContext;
  }

  initialize(ctx: OAuthContext) {
    this.ctx = ctx;

    this.ctx.app.get('/providers', async (request, reply) => {
      reply.send({
        providers: this.oAuthProviders.map((provider) => ({
          name: provider.name,
          buttonUri: provider.buttonUri,
        })),
      });
    });
  }

  add(provider: OAuthProvider) {
    if (this.get(provider.name)) {
      throw new Error('Provider already exists: ' + provider.name);
    }
    console.info(`Adding OAuth provider: ${provider.name}`);
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
