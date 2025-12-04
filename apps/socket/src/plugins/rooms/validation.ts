import { z } from 'zod';
import { Action } from '../../roomHandlers/game/index.js';

const GameDataSchema = z.object({
  action: z.enum(Action).optional(),
  subtype: z.string().optional(),
});

/**
 * Schema for incoming socket messages
 */
export const SocketMessage = z.object({
  type: z.enum(['join-room', 'leave-room', 'message']),
  room: z.string().regex(/^[a-zA-Z0-9]+(:[a-zA-Z0-9_-]+)?$/),
  // data: z.any().optional(),
  data: GameDataSchema.optional(),
});
export type SocketMessageType = z.infer<typeof SocketMessage>;

export function getValidMessage(input: Buffer) {
  // parse to object
  const json = JSON.parse(input.toString()) as SocketMessageType;
  // validate against schema
  const parsedMessage = SocketMessage.safeParse(json);
  if (!parsedMessage.success) {
    throw new Error(
      'Invalid message format: ' + z.prettifyError(parsedMessage.error)
    );
  }
  return parsedMessage.data;
}
