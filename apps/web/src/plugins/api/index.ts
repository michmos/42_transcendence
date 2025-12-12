import UserAPI from './user.js';
import * as AuthAPI from './auth.js';
import TournamentsAPI from './tournaments.js';
import FriendsAPI from './friends.js';
import MatchAPI from './match.js';

const API = {
  ...UserAPI,
  ...AuthAPI,
  ...TournamentsAPI,
  ...FriendsAPI,
  ...MatchAPI,
};

export default API;
