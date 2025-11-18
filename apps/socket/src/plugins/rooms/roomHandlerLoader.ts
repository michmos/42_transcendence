import fs from 'fs';
import path from 'path';

/**
 * Registers all room Handlers and return them, i.e.
 * stores their default export as a callback mapped to their directory name
 */
export async function loadRoomHandlers() {
  const __dirname = path.dirname(new URL(import.meta.url).pathname);
  const roomsDir = path.resolve(__dirname, '../../roomHandlers/');
  const rooms = fs.readdirSync(roomsDir);
  const roomHandlers: Record<string, Function> = {};

  console.info('⚙️  Auto-loading room handlers...');
  for (const room of rooms) {
    const roomName = room;
    try {
      const module = await import(`${roomsDir}/${roomName}/index.js`);
      roomHandlers[roomName] = module.default;
      console.info(`☑️ Handler: ${roomName} loaded`);
    } catch (error) {
      console.warn(`❌ Handler: ${roomName} couldn't be loaded: `, error);
    }
  }
  return roomHandlers;
}

export function getRoomHandler(
  room: string,
  handlers: Record<string, Function>
) {
  // handlerName can't be undefined since zod validation ensures it matches the regex
  const handlerName = room.split(':')[0] as string;
  const handler = handlers[handlerName];
  if (!handler) {
    throw new Error(
      `getHandler: Invalid handler name provided: \'${handlerName}\': not found`
    );
  }
  return handler;
}
