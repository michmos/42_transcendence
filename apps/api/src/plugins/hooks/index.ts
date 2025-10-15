import { type FastifyInstance } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import extractUserHook from './extractUser.js';
import checkAuthHook from './checkAuth.js';

export default fastifyPlugin(async function (app: FastifyInstance) {
  // root decorators
  app.decorateRequest('user', undefined);
  app.decorate('addAuthHook', () => app.addHook('onRequest', checkAuthHook));

  // hooks
  app.addHook('onRequest', (request, reply) => {
    if (request.url.split('?')[0] === '/' || request.routeOptions.url === '/') {
      // add root scoped hooks here
      return;
    }
    // add non-root (any other route) hooks here
    extractUserHook(request, reply);
  });
});
