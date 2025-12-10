import { RoomManager, WSocket } from '../../plugins/rooms/WSocket/index.js';
import { env } from '../../env.js';
import type { OnlineStatus, OnlineUsers, OnlineUser } from 'types';

const onlineUsers: OnlineUsers = new Map<string, OnlineUser>();

export default {
  onOpen: async (socket: WSocket) => {
    socket.join('online');

    const selfNicknameResponse: Response = await fetch(
      `${env.API_SERVER}/user/me/nickname`,
      {
        method: 'GET',
        headers: {
          Cookie: `session=${socket.jwt}`,
        },
        credentials: 'include',
      }
    );
    if (!selfNicknameResponse.ok) {
      console.error(
        'room "Online": Failed onOpen broadcast - Getting user nickname failed'
      );
      return;
    }
    const nickname = (
      (await selfNicknameResponse.json()) as { nickname: string }
    ).nickname;

    const result = onlineUsers.get(socket.uuid);
    // If result is not undefined, that means user already has a socket open, we only +1 to socketCount, we don't broadcast online message.
    // If result is undefined, we add new entry to onlineUsers map and broadcast online message to everyone in the 'Online' room.
    if (result) {
      onlineUsers.set(socket.uuid, {
        ...result,
        socketCount: result.socketCount + 1,
      });
    } else {
      onlineUsers.set(socket.uuid, { nickname, socketCount: 1 });
      const userOnlineStatusResponse: Response = await fetch(
        `${env.API_SERVER}/user/me/isOnline/true`,
        {
          method: 'PATCH',
          headers: {
            Cookie: `session=${socket.jwt}`,
          },
        }
      );
      if (!userOnlineStatusResponse.ok) {
        console.error(
          'room "Online": Failed to make API call to change user "isOnline" field to "true" in db'
        );
      }

      const isOnlineMessage: OnlineStatus = {
        event: 'status-update',
        nickname: nickname,
        isOnline: true,
      };
      RoomManager.get('online')?.broadcast(JSON.stringify(isOnlineMessage));
    }
  },

  onClose: async (socket: WSocket) => {
    socket.leave('online');

    const result = onlineUsers.get(socket.uuid);
    if (!result) return;

    const newCount = result.socketCount - 1;

    onlineUsers.set(socket.uuid, {
      ...result,
      socketCount: newCount,
    });

    // If user leaves 'Online' room with last socket, broadcast user is now offline
    if (newCount === 0) {
      onlineUsers.delete(socket.uuid);
      const userOnlineStatusResponse: Response = await fetch(
        `${env.API_SERVER}/user/me/isOnline/false`,
        {
          method: 'PATCH',
          headers: {
            Cookie: `session=${socket.jwt}`,
          },
        }
      );
      if (!userOnlineStatusResponse.ok) {
        console.error(
          'room "Online": Failed to make API call to change user isOnline field to "false" in db'
        );
      }

      const isOnlineMessage: OnlineStatus = {
        event: 'status-update',
        nickname: result.nickname,
        isOnline: false,
      };
      RoomManager.get('online')?.broadcast(JSON.stringify(isOnlineMessage));
    }
  },
};
