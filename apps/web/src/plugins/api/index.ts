import UserAPI from './user.js';
import TournamentApi from './tournament.js';

const API = {
  ...UserAPI,
  ...TournamentApi,
};

export default API;
