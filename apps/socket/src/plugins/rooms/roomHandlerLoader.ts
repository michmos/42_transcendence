import fs from 'fs';
import path from 'path';
import { z, type ZodSafeParseResult } from 'zod';
import { WSocket } from './WSocket/index.js';
import { SocketMessage, type SocketMessageType } from './validation.js';

const ZodWSocket = z.custom<WSocket>((val) => {
  return val instanceof WSocket;
});

/**
 * Schema for handler exports
 */
const Handler = z.object({
  onStartup: z.optional(z.function({ input: [] })),
  onOpen: z.optional(z.function({ input: [ZodWSocket] })),
  onMessage: z.optional(z.function({ input: [ZodWSocket, SocketMessage] })),
  onClose: z.optional(z.function({ input: [ZodWSocket] })),
});
type HandlerType = z.infer<typeof Handler>;

const roomHandlers: Record<string, HandlerType> = {};

/**
 * Registers all room Handlers
 */
export async function loadRoomHandlers() {
  const __dirname = path.dirname(new URL(import.meta.url).pathname);
  const roomsDir = path.resolve(__dirname, '../../roomHandlers/');
  const rooms = fs.readdirSync(roomsDir);

  for (const room of rooms) {
    const roomName = room;
    try {
      const module: unknown = await import(`${roomsDir}/${roomName}/index.js`);
      if (!module || typeof module !== 'object' || !('default' in module)) {
        throw new Error('Module does not have a default export');
      }
      const result: ZodSafeParseResult<HandlerType> = Handler.safeParse(
        module.default
      );
      if (!result.success) {
        throw new Error(z.prettifyError(result.error));
      }
      roomHandlers[roomName] = result.data;
      console.info(`☑️  Handler: ${roomName} loaded`);
    } catch (error) {
      console.error(
        `❌ Handler: ${roomName} could not be loaded: `,
        (error as Error).message
      );
    }
  }
}

export async function runOnStartupHooks() {
  const onSartupCallbacks = Object.values(roomHandlers).filter(
    (handler) => handler.onStartup
  );
  const results = await Promise.allSettled(
    onSartupCallbacks.map((handler) => {
      if (!handler.onStartup) return;
      return handler.onStartup();
    })
  );
  for (const result of results) {
    if (result.status === 'rejected') {
      console.error('Error in onStartup hook:', result.reason);
    }
  }
}

export async function runOnOpenHooks(socket: WSocket) {
  const onOpenCallbacks = Object.values(roomHandlers).filter(
    (handler) => handler.onOpen
  );
  const results = await Promise.allSettled(
    onOpenCallbacks.map((handler) => {
      if (!handler.onOpen) return;
      return handler.onOpen(socket);
    })
  );
  for (const result of results) {
    if (result.status === 'rejected') {
      console.error('Error in onOpen hook:', result.reason);
    }
  }
}

export async function runOnCloseHooks(socket: WSocket) {
  const onCloseCallbacks = Object.values(roomHandlers).filter(
    (handler) => handler.onClose
  );
  const results = await Promise.allSettled(
    onCloseCallbacks.map((handler) => {
      if (!handler.onClose) return;
      return handler.onClose(socket);
    })
  );
  for (const result of results) {
    if (result.status === 'rejected') {
      console.error('Error in onClose hook:', result.reason);
    }
  }
}

export async function runMessageHandler(
  socket: WSocket,
  message: SocketMessageType
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
