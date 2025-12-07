import UserAPI from './user.js';
import * as AuthAPI from './auth.js';
import TournamentAPI from './tournaments.js';
import FriendsAPI from './friends.js';

const API = {
  ...UserAPI,
  auth: AuthAPI,
  tournaments: TournamentAPI,
  friends: FriendsAPI,
};

export default API;
export { AuthAPI };
