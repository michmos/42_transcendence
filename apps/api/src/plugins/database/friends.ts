import type { Friends, friendshipState } from 'db/generated/client/index.js';
import Database from 'db';

export async function findFriendRecord(
  uuidSelf: string,
  uuidOther: string
): Promise<Friends | null> {
  return Database.friends.findFirst({
    where: {
      OR: [
        {
          friendAId: uuidSelf,
          friendBId: uuidOther,
        },
        {
          friendAId: uuidOther,
          friendBId: uuidSelf,
        },
      ],
    },
  });
}

export async function addFriend(
  uuidSelf: string,
  uuidOther: string
): Promise<Friends> {
  return Database.friends.create({
    data: {
      friendAId: uuidSelf,
      friendBId: uuidOther,
    },
  });
}

export async function modifyFriendsState(
  uuid: string,
  newState: friendshipState
): Promise<Friends> {
  return Database.friends.update({
    where: { uuid },
    data: { state: newState },
  });
}

export async function getFriends(uuid: string): Promise<object[]> {
  const foundRelations = await Database.friends.findMany({
    where: {
      AND: [
        {
          OR: [{ friendAId: uuid }, { friendBId: uuid }],
        },
        {
          OR: [{ state: 'ACCEPTED' }, { state: 'REQUESTED' }],
        },
      ],
    },
    select: {
      friendAId: true,
      friendBId: true,
      friendA: { select: { nickname: true, avatar: true } },
      friendB: { select: { nickname: true, avatar: true } },
      state: true,
    },
  });

  const friendsList = foundRelations.map((f) => {
    const friend = f.friendAId === uuid ? f.friendB : f.friendA;
    return { ...friend, state: f.state };
  });

  return friendsList;
}

export async function deleteFriend(uuid: string): Promise<Friends> {
  return Database.friends.delete({
    where: { uuid },
  });
}

// This function is mainly for when a user's account gets deleted
export async function deleteMultipleFriends(uuid: string) {
  return Database.friends.deleteMany({
    where: {
      OR: [{ friendAId: uuid }, { friendBId: uuid }],
    },
  });
}

export async function getAllFriendRecords(): Promise<Friends[]> {
  return Database.friends.findMany();
}
