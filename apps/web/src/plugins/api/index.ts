import UserAPI from './user.js';
import TournamentsAPI from './tournaments.js';
import FriendsAPI from './friends.js';
import MatchAPI from './match.js';

const API = {
  ...UserAPI,
  ...TournamentsAPI,
  ...FriendsAPI,
  ...MatchAPI,
};

export default API;
