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
export { SocketMessage, type SocketMessageType } from './validation.js';
import { WSocket } from './WSocket/index.js';

interface IIdentifiers {
  uuid: string;
  jwt: string;
}

/**
 * Main room plugin; handles incoming messages and
 * routes them to the appropriate room handlers
 * @param app Fastify instance
 */
async function roomPlugin(app: FastifyInstance) {
  await loadRoomHandlers();
  await runOnStartupHooks();

  app.get(
    '/',
    {
      websocket: true,
    },
    async (webSocket, request: FastifyRequest) => {
      const identifiers = request.getDecorator<IIdentifiers>('identifiers');
      if (!identifiers) {
        console.error('Unauthorized websocket connection attempt');
        return;
      }
      const socket = new WSocket(webSocket, identifiers.uuid, identifiers.jwt);

      socket.onClose(async () => {
        socket.lastSeen = new Date(Date.now());
        await runOnCloseHooks(socket);
      });

      socket.onMessage(async (input: Buffer) => {
        const message = getValidMessage(input);
        await runMessageHandler(socket, message);
      });

      // perform async work after registering event handlers
      // to not drop messages
      try {
        await runOnOpenHooks(socket);
      } catch (error) {
        console.error(
          `[${socket.uuid}]: error on open: ${(error as Error).message}`
        );
      }
    }
  );
}

export default fp(roomPlugin, {
  name: 'room-plugin',
});
