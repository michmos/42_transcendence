import type { OAuthContext } from '../../index.js';

function setupLogoutRoute(ctx: OAuthContext) {
  // Logout endpoint to clear the session cookie
  ctx.app.get('/logout', async (request, reply) => {
    reply.clearCookie('session', { path: '/' });

    // Call logout callback if registered
    if (ctx.callbacks['logout']) {
      return ctx.callbacks['logout'](null);
    }

    // Redirect when no logout callback is defined
    // return reply.redirect('/');
    return reply.status(200).send({ message: 'Logged out successfully' });
  });
}

export default setupLogoutRoute;
