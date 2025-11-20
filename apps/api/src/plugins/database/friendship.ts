import type { Friendship, friendshipState } from 'db/generated/client/index.js';
import Database from 'db';

export interface fullFriendshipRecord {
  uuid: string;
  createdAt: Date;
  updatedAt: Date;
  friendAId: string;
  friendBId: string;
  state: friendshipState;
  friendA: { nickname: string; avatar: string | null };
  friendB: { nickname: string; avatar: string | null };
}

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
): Promise<fullFriendshipRecord> {
  return Database.friendship.create({
    data: {
      friendAId: uuidSelf,
      friendBId: uuidOther,
    },
    include: {
      friendA: { select: { nickname: true, avatar: true } },
      friendB: { select: { nickname: true, avatar: true } },
    },
  });
}

export async function modifyFriendsState(
  uuid: string,
  newState: friendshipState
): Promise<fullFriendshipRecord> {
  return Database.friendship.update({
    where: { uuid },
    data: { state: newState },
    include: {
      friendA: { select: { nickname: true, avatar: true } },
      friendB: { select: { nickname: true, avatar: true } },
    },
  });
}

export async function getFriendsMe(uuid: string): Promise<object[]> {
  const foundRelations = await Database.friendship.findMany({
    where: {
      OR: [
        {
          AND: [
            {
              OR: [{ friendAId: uuid }, { friendBId: uuid }],
            },
            {
              OR: [{ state: 'ACCEPTED' }, { state: 'REQUESTED' }],
            },
          ],
        },
        { AND: [{ friendBId: uuid }, { state: 'REJECTED' }] },
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
    const isRequester = f.friendAId === uuid;
    const friend = f.friendAId === uuid ? f.friendB : f.friendA;
    return { ...friend, state: f.state, isRequester };
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

export async function getUserFriendRecords(
  uuid: string
): Promise<Partial<fullFriendshipRecord>[]> {
  return Database.friendship.findMany({
    where: { OR: [{ friendAId: uuid }, { friendBId: uuid }] },
    include: {
      friendA: { select: { nickname: true, avatar: true } },
      friendB: { select: { nickname: true, avatar: true } },
    },
  });
}

export async function deleteAllFriendRelations() {
  await Database.friendship.deleteMany();
}
