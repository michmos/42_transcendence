import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { WSocket } from './WSocket/index.js';
import { SocketMessage } from './validation.js';

const ZodWSocket = z.custom<WSocket>((val) => {
  return val instanceof WSocket;
});
type ZodWSocket = z.infer<typeof ZodWSocket>;

/**
 * Schema for handler exports
 */
const Handler = z.object({
  onStartup: z.optional(z.function({ input: [] })),
  onOpen: z.optional(z.function({ input: [ZodWSocket] })),
  onMessage: z.optional(z.function({ input: [ZodWSocket, SocketMessage] })),
  onClose: z.optional(z.function({ input: [ZodWSocket] })),
});
type Handler = z.infer<typeof Handler>;

const roomHandlers: Record<string, Handler> = {};

/**
 * Registers all room Handlers
 */
export async function loadRoomHandlers() {
  const __dirname = path.dirname(new URL(import.meta.url).pathname);
  const roomsDir = path.resolve(__dirname, '../../roomHandlers/');
  const rooms = fs.readdirSync(roomsDir);

  console.info('⚙️  Auto-loading room handlers...');
  for (const room of rooms) {
    const roomName = room;
    try {
      const module = await import(`${roomsDir}/${roomName}/index.js`);
      const result = Handler.safeParse(module.default);
      if (!result.success) {
        throw new Error(z.prettifyError(result.error));
      }
      roomHandlers[roomName] = result.data;
      console.info(`☑️ Handler: ${roomName} loaded`);
    } catch (error) {
      console.error(
        `❌ Handler: ${roomName} could not be loaded: `,
        (error as Error).message
      );
    }
  }
}

export async function runOnStartupHooks() {
  for (const [, handler] of Object.entries(roomHandlers)) {
    if (handler.onStartup) await handler.onStartup();
  }
}
export async function runOnOpenHooks(socket: WSocket) {
  for (const [, handler] of Object.entries(roomHandlers)) {
    if (handler.onOpen) await handler.onOpen(socket);
  }
}
export async function runOnCloseHooks(socket: WSocket) {
  for (const [, handler] of Object.entries(roomHandlers)) {
    if (handler.onClose) await handler.onClose(socket);
  }
}

export async function runMessageHandler(
  socket: WSocket,
  message: SocketMessage
) {
  // handlerName can't be undefined since zod validation ensures it matches the regex
  const handlerName = message.room.split(':')[0] as string;
  const messageHandler = roomHandlers[handlerName]?.onMessage;
  if (!messageHandler) {
    throw new Error(
      `getHandler: No Message Handler provided for: '${handlerName}'`
    );
  }
  await messageHandler(socket, message);
}
