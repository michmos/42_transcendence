import { z } from 'zod';
import { type WebSocket } from 'ws';

/**
 * Schema for incoming socket messages
 */
const SocketNormalMessage = z.object({
  type: z.enum(['join-room', 'leave-room', 'message']),
  room: z.string().regex(/^[a-zA-Z0-9]+(:[a-zA-Z0-9_-]+)?$/),
  data: z.any().optional(),
});
const SocketIdentificationMessage = z.object({
  type: z.literal('identify'),
  JWT: z.string().regex(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/),
});
const SocketMessage = z.discriminatedUnion('type', [
  SocketNormalMessage,
  SocketIdentificationMessage,
]);

export type SocketMessage = z.infer<typeof SocketMessage>;

export function getValidMessage(input: Buffer, socket: WebSocket) {
  // parse to object
  const json = JSON.parse(input.toString()) as SocketMessage;
  // validate against schema
  const parsedMessage = SocketMessage.safeParse(json);
  if (!parsedMessage.success) {
    throw new Error('Invalid message format');
  }
  const message = parsedMessage.data;
  if (message.type !== 'identify' && !socket.getData()?.uuid) {
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
