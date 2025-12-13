export interface UserMatch {
  date: string;
  score1: number;
  score2: number;
  player1: string;
  player2: string;
  result: 'WON' | 'LOST';
  gameType: string;
}

export interface FriendData {
  otherUser: string;
  avatar: string | null;
  state: 'REQUESTED' | 'ACCEPTED' | 'REJECTED';
  isRequester: boolean;
  isOnline: boolean;
}

export interface CleanedSelfUserData {
  createdAt: Date;
  nickname: string;
  avatar: string;
  role: 'ADMIN' | 'MEMBER';
  isOnline: boolean;
}

export interface SelfUserProfileData {
  cleanedUser: CleanedSelfUserData;
  cleanedUserFriends: FriendData[];
  userMatches: UserMatch[];
}

export interface CleanedOtherUserData {
  nickname: string;
  avatar: string;
  isOnline: boolean;
}

export interface OtherUserProfileData {
  cleanedUser: CleanedOtherUserData;
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
