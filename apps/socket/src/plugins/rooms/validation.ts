import { z } from 'zod';
import { type WebSocket } from 'ws';

/**
 * Schema for incoming socket messages
 */
const SocketMessage = z.object({
  type: z.enum(['join-room', 'leave-room', 'message', 'connect']),
  room: z.string().regex(/^[a-zA-Z0-9]+(:[a-zA-Z0-9_-]+)?$/),
  data: z.any().optional(),
});
export type SocketMessage = z.infer<typeof SocketMessage>;

export function getValidMessage(input: Buffer, socket: WebSocket) {
  // validate against schema
  const parsedMessage = SocketMessage.safeParse(input.toString());
  if (!parsedMessage.success) {
    throw new Error('Invalid message format');
  }
  const message = parsedMessage.data;
  // some types only work, if you are in the room (e.g. you can't leave a room without being in it)
  if (
    (message.type === 'message' || message.type === 'leave-room') &&
    !socket.isIn(message.room)
  ) {
    throw new Error(
      `Unauthorized access attempt: socket is not in room ${message.room}`
    );
  }
  return message;
}
