import type { OAuthContext } from '../../index.js';
import TokenUtility from '../../utils/token/index.js';

function setupLogoutRoute(ctx: OAuthContext) {
  // Logout endpoint to clear the session cookie
  ctx.app.get('/auth/logout', async (request, reply) => {
    const { session: sessionCookieValue } = request.cookies;

    if (!sessionCookieValue)
      return reply.status(200).send({ message: 'No active session' });

    const sessionCookie = TokenUtility.verifySessionToken(sessionCookieValue);
    if (!sessionCookie) {
      // Invalid session cookie, clear it anyway
      return reply.clearCookie('session', { path: '/' }).status(200).send({
        message: 'Session invalid, but cookie cleared',
      });
    }

    reply.clearCookie('session', { path: '/' });

    // Call logout callback if registered
    if (ctx.callbacks['logout']) {
      ctx.callbacks['logout'](sessionCookie);
    }

    return reply.status(200).send({ message: 'Logged out successfully' });
  });
}

export default setupLogoutRoute;
