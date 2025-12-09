import {
  type fullFriendshipRecord,
  type cleanedFriendshipRecord,
} from './types.js';

export function cleanFriendshipRecord(
  uuidSelf: string,
  friendRecord: fullFriendshipRecord
): cleanedFriendshipRecord {
  return {
    otherUser:
      friendRecord.friendAId === uuidSelf
        ? friendRecord.friendB.nickname
        : friendRecord.friendA.nickname,
    avatar:
      friendRecord.friendAId === uuidSelf
        ? friendRecord.friendB.avatar
        : friendRecord.friendA.avatar,
    state: friendRecord.state,
    isRequester: friendRecord.friendAId === uuidSelf,
    isOnline:
      friendRecord.friendAId === uuidSelf
        ? friendRecord.friendB.isOnline
        : friendRecord.friendA.isOnline,
  };
}

export function cleanFriendshipList(
  uuidSelf: string,
  friendList: fullFriendshipRecord[]
): cleanedFriendshipRecord[] {
  const cleanedFriendsList = friendList.map((f) => {
    const otherUser =
      f.friendAId === uuidSelf ? f.friendB.nickname : f.friendA.nickname;
    const avatar =
      f.friendAId === uuidSelf ? f.friendB.avatar : f.friendA.avatar;
    const isRequester = f.friendAId === uuidSelf;
    const isOnline =
      f.friendAId === uuidSelf ? f.friendB.isOnline : f.friendA.isOnline;
    return { otherUser, avatar, state: f.state, isRequester, isOnline };
  });

  return cleanedFriendsList;
}
