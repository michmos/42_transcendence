import {
  RoomManager,
  WSocket,
  User,
} from '../../plugins/rooms/WSocket/index.js';
import { env } from '../../env.js';

export default {
  // onStartup: async () => {
  //   console.log('Loading up Online room');
  // },

  onOpen: async (socket: WSocket) => {
    socket.join('online');
    const user: User | null = socket.getUser();

    if (user === null) return;

    // If user now only has 1 socket with online room, broadcast
    if (user.socketCount() === 1) {
      const selfNicknameResponse: Response = await fetch(
        `${env.API_SERVER}/user/me/nickname/`,
        {
          method: 'GET',
          headers: {
            Cookie: `session=${socket.jwt}`,
          },
          credentials: 'include',
        }
      );
      if (!selfNicknameResponse) {
        console.error(
          'room "Online": Failed onOpen broadcast - Getting user nickname failed'
        );
        return;
      }

      const selfNickname = (await selfNicknameResponse.json()) as string;
      const userIsOnline: string = selfNickname + ':true';
      RoomManager.get('online')?.broadcast(userIsOnline);
    }
  },

  onClose: async (socket: WSocket) => {
    socket.leave('online');
    const user: User | null = socket.getUser();

    if (user === null) return;

    // If user now only has 1 socket with online room, broadcast
    if (user.socketCount() === 0) {
      const selfNicknameResponse: Response = await fetch(
        `${env.API_SERVER}/user/me/nickname/`,
        {
          method: 'GET',
          headers: {
            Cookie: `session=${socket.jwt}`,
          },
          credentials: 'include',
        }
      );
      if (!selfNicknameResponse) {
        console.error(
          'room "Online": Failed onClose broadcast - Getting user nickname failed'
        );
        return;
      }

      const selfNickname = (await selfNicknameResponse.json()) as string;
      const userIsOnline: string = selfNickname + ':false';
      RoomManager.get('online')?.broadcast(userIsOnline);
    }
  },
};
