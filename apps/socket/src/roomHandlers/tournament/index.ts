import { type SocketMessage } from '../../plugins/rooms/index.js';

export default async function (
  socket: WebSocket,
  message: SocketMessage
): Promise<void> {
  console.log(
    `mocking tournament room handler: received message: `,
    JSON.stringify(message)
  );
}
