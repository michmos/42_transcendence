import { type FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { type FastifyInstance } from 'fastify';
import {
  loadRoomHandlers,
  runOnStartupHooks,
  runOnCloseHooks,
  runOnOpenHooks,
  runMessageHandler,
} from './roomHandlerLoader.js';
import { getValidMessage } from './validation.js';
export { type SocketMessage } from './validation.js';
import { authenticateClient } from './authentication.js';
import { WSocket } from './WSocket/index.js';

/**
 * Main room plugin; handles incoming messages and
 * routes them to the appropriate room handlers
 * @param app Fastify instance
 */
async function roomPlugin(app: FastifyInstance) {
  await loadRoomHandlers();
  await runOnStartupHooks();

  app.addHook('preValidation', async (request, reply) => {
    try {
      await authenticateClient(request);
    } catch (error) {
      console.error(
        'Authentication error:',
        error instanceof Error ? error.message : error
      );
      await reply.code(401).send('not authenticated');
    }
  });

  app.get(
    '/',
    {
      websocket: true,
    },
    async (webSocket, request: FastifyRequest) => {
      if (!request.user) {
        console.error('Unauthorized websocket connection attempt');
        return;
      }
      const socket = new WSocket(webSocket, request.user.uuid);

      socket.onClose(async () => {
        socket.lastSeen = new Date(Date.now());
        await runOnCloseHooks(socket);
      });

      socket.onMessage(async (input: Buffer) => {
        const message = getValidMessage(input, socket);
        await runMessageHandler(socket, message);
      });

      // perform async work after registering event handlers
      // to not drop messages
      try {
        await runOnOpenHooks(socket);
      } catch (error) {
        console.error(`[${socket.uuid}]: error on open: ${error}`);
      }
    }
  );
}

export default fp(roomPlugin, {
  name: 'room-plugin',
});
