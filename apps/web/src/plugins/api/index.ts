import UserAPI from './user.js';
import * as AuthAPI from './auth.js';
import TournamentAPI from './tournaments.js';
import FriendsAPI from './friends.js';
import MatchAPI from './match.js';

const API = {
  user: UserAPI,
  auth: AuthAPI,
  tournaments: TournamentAPI,
  friends: FriendsAPI,
  match: MatchAPI,
};

export default API;
