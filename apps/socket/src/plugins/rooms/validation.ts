import { z } from 'zod';
import { type WebSocket } from 'ws';

/**
 * Schema for incoming socket messages
 */
export const SocketMessage = z.object({
  type: z.enum(['join-room', 'leave-room', 'message']),
  room: z.string().regex(/^[a-zA-Z0-9]+(:[a-zA-Z0-9_-]+)?$/),
  data: z.any().optional(),
});
export type SocketMessage = z.infer<typeof SocketMessage>;

export function getValidMessage(input: Buffer, socket: WebSocket) {
  // parse to object
  const json = JSON.parse(input.toString()) as SocketMessage;
  // validate against schema
  const parsedMessage = SocketMessage.safeParse(json);
  if (!parsedMessage.success) {
    throw new Error(
      'Invalid message format: ' + z.prettifyError(parsedMessage.error)
    );
  }
  const message = parsedMessage.data;
  if (!socket.getData()?.uuid) {
    throw new Error(
      'Unauthorized access attempt: socket is not identified yet'
    );
  }
  if (
    (message.type === 'message' || message.type === 'leave-room') &&
    !socket.isIn(message.room)
  ) {
    throw new Error(
      `Unauthorized access attempt: type \'${message.type}\' can only be performed in rooms the user is part of`
    );
  }
  return message;
}
