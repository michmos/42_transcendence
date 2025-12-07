import {
  RoomManager,
  WSocket,
  User,
} from '../../plugins/rooms/WSocket/index.js';
import { env } from '../../env.js';

export default {
  onStartup: async () => {
    console.log('Loading up Online room');
  },

  onOpen: async (socket: WSocket) => {
    socket.join('online');
    const user: User = socket.getUser();

    // If user now only has 1 socket with online room, broadcast
    if (user.socketCount() === 1) {
      const selfNicknameResponse: Response = await fetch(`${env.API_SERVER}/user/me/nickname/`, {
        method: 'GET',
        headers: {
          Cookie: `session=${socket.jwt}`,
        },
        credentials: 'include',
      });
      // if (!selfNicknameResponse)
        // Error handling

      const selfNickname = (await selfNicknameResponse.json()) as string;
      const userIsOnline: string = selfNickname + ':true';
      RoomManager.get('online')?.broadcast(userIsOnline);
      // const friendsUuidResponse: Response = await fetch(`${env.API_SERVER}/friends/`, {
      //   method: 'GET',
      //   headers: {
      //     Cookie: `session=${socket.jwt}`,
      //   },
      //   credentials: 'include',
      // });
      // if (!friendsUuidResponse)
        // Error handling
      // const friendsData = (await friendsUuidResponse.json()) as string[];
      // friendsData.array.forEach(element => {
      //   // if element in Online room, then:
      //   RoomManager.get('online')?.broadcast(userIsOnline);
      // });
    }
  },

  onClose: async (socket: WSocket) => {
    socket.leave('online');

    const user: User = socket.getUser();

    // If user now only has 1 socket with online room, broadcast
    if (user.socketCount() === 0) {
      const selfNicknameResponse: Response = await fetch(`${env.API_SERVER}/user/me/nickname/`, {
        method: 'GET',
        headers: {
          Cookie: `session=${socket.jwt}`,
        },
        credentials: 'include',
      });
      // if (!selfNicknameResponse)
        // Error handling

      const selfNickname = (await selfNicknameResponse.json()) as string;
      const userIsOnline: string = selfNickname + ':false';
      RoomManager.get('online')?.broadcast(userIsOnline);
      // const friendsUuidResponse: Response = await fetch(`${env.API_SERVER}/friends/`, {
      //   method: 'GET',
      //   headers: {
      //     Cookie: `session=${socket.jwt}`,
      //   },
      //   credentials: 'include',
      // });
      // if (!friendsUuidResponse)
        // Error handling
      // const friendsData = (await friendsUuidResponse.json()) as string[];
      // friendsData.array.forEach(element => {
      //   // if element in Online room, then:
      //   RoomManager.get('online')?.broadcast(userIsOnline);
      // });
    }
  },
};

// LEFT OFF AT:
//
// 1. Made a getFriendsNicknames api call function to get an array of a user's friend UUIDs
// -------- This API call needs the UUID, so an object of { uuid }
// -------------- WHY? Uuid for going through the user list in the room. Nickname for the frontend to check what friend elements to update

// 2. When joining the Online room, we check if the user already has a socket in the room

// 3. If it is the first socket:
// --- Make an API call to get own nickname
// --- make an API call to get all accepted friends

// 3.1. Then in a while loop, go through the uuids of the accepted friends and check if they're in the Online room
// --- If yes, broadcast own nickname and isOnline, like this : { nickname: nickname, isOnline: true }
// --- If no, move on to next friend uuid

// 5. If it is NOT the first socket, do nothing

// 6. Do the same for leaving, but online broadcast on last socket of a user leaving the room
