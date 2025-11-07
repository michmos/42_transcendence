import type { Friendship, friendshipState } from 'db/generated/client/index.js';
import Database from 'db';

export async function findFriendRecord(
  uuidSelf: string,
  uuidOther: string
): Promise<Friendship | null> {
  return Database.friendship.findFirst({
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
): Promise<Friendship> {
  return Database.friendship.create({
    data: {
      friendAId: uuidSelf,
      friendBId: uuidOther,
    },
  });
}

export async function modifyFriendsState(
  uuid: string,
  newState: friendshipState
): Promise<Friendship> {
  return Database.friendship.update({
    where: { uuid },
    data: { state: newState },
  });
}

export async function getFriends(uuid: string): Promise<object[]> {
  const foundRelations = await Database.friendship.findMany({
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

export async function deleteFriend(uuid: string): Promise<Friendship> {
  return Database.friendship.delete({
    where: { uuid },
  });
}

// This function is mainly for when a user's account gets deleted
export async function deleteMultipleFriends(uuid: string) {
  return Database.friendship.deleteMany({
    where: {
      OR: [{ friendAId: uuid }, { friendBId: uuid }],
    },
  });
}

export async function getAllFriendRecords(): Promise<Friendship[]> {
  return Database.friendship.findMany();
}
