import type { Friendship, friendshipState } from 'db/generated/client/index.js';
import { type fullFriendshipRecord } from '../../routes/friends/types.js';
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
): Promise<fullFriendshipRecord> {
  return Database.friendship.create({
    data: {
      friendAId: uuidSelf,
      friendBId: uuidOther,
    },
    include: {
      friendA: { select: { nickname: true, avatar: true, isOnline: true } },
      friendB: { select: { nickname: true, avatar: true, isOnline: true } },
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
      friendA: { select: { nickname: true, avatar: true, isOnline: true } },
      friendB: { select: { nickname: true, avatar: true, isOnline: true } },
    },
  });
}

export async function getFriendsMe(
  uuid: string
): Promise<fullFriendshipRecord[]> {
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
    include: {
      friendA: { select: { nickname: true, avatar: true, isOnline: true } },
      friendB: { select: { nickname: true, avatar: true, isOnline: true } },
    },
  });

  return foundRelations;
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
): Promise<fullFriendshipRecord[]> {
  return Database.friendship.findMany({
    where: { OR: [{ friendAId: uuid }, { friendBId: uuid }] },
    include: {
      friendA: { select: { nickname: true, avatar: true, isOnline: true } },
      friendB: { select: { nickname: true, avatar: true, isOnline: true } },
    },
  });
}

export async function deleteAllFriendRelations() {
  await Database.friendship.deleteMany();
}
