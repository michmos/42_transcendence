import * as matchApiCalls from './match.js';
import * as tournamentApiCalls from './tournament.js';
import * as userApiCalls from './user.js';

export const API = {
  ...matchApiCalls,
  ...tournamentApiCalls,
  ...userApiCalls,
};
