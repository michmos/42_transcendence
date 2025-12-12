export interface ProfileMatch {
  date: string;
  score1: number;
  score2: number;
  player1: string;
  player2: string;
  result: 'WON' | 'LOST';
  gameType: string;
}

export interface ProfileFriend {
  otherUser: string;
  avatar: string | null;
  state: 'REQUESTED' | 'ACCEPTED' | 'REJECTED';
  isRequester: boolean;
  isOnline: boolean;
}

export interface CleanedUserData {
  createdAt: Date;
  nickname: string;
  avatar: string;
  role: 'ADMIN' | 'MEMBER';
  isOnline: boolean;
}

export interface UserProfileData {
  cleanedUserData: CleanedUserData;
  cleanedUserFriends: ProfileFriend[];
  userMatches: ProfileMatch[];
}

export interface CleanedOtherUser {
  nickname: string;
  avatar: string;
  isOnline: boolean;
}

export interface OtherUserProfileData {
  cleanedUser: CleanedOtherUser;
  matches: {
    gamesPlayed: number;
    gamesWon: number;
    tournamentsPlayed: number;
  };
}

export interface OnlineStatus {
  event: 'status-update';
  nickname: string;
  isOnline: boolean;
}

export interface OnlineUser {
  nickname: string;
  socketCount: number;
}

export interface TournamentParticipation {
  tournamentId: string;
  alias: string;
}

export type OnlineUsers = Map<string, OnlineUser>;
