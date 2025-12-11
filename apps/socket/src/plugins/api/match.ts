import { env } from '../../env.js';
import { type GameRoomData } from '../../roomHandlers/game/index.js';
import { type MatchParticipantsResponse } from 'types';

export async function postFinishedOnlineMatch(game: GameRoomData) {
  let winnerId;
  if (game.currentGameState.leftScore != game.currentGameState.rightScore) {
    winnerId =
      game.currentGameState.leftScore > game.currentGameState.rightScore
        ? game.player1Uuid
        : game.player2Uuid;
  }
  // fetch from API
  const response = await fetch(`http://localhost:5173/api/match/`, {
    // TODO: hardcoded localhost
    method: 'POST',
    headers: {
      'x-api-key': env.ADMIN_API_KEY,
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      player1Id: game.player1Uuid,
      player2Id: game.player2Uuid,
      score1: game.currentGameState.leftScore,
      score2: game.currentGameState.rightScore,
      winnerId,
      status: 'finished',
    }),
  });
  if (!response.ok) {
    throw new Error(
      `Posting finished online match failed: ${response.status} ${response.statusText}`
    );
  }
}

export async function patchFinishedTournamentMatch(
  game: GameRoomData,
  matchUuid: string
) {
  let winnerId;
  if (game.currentGameState.leftScore != game.currentGameState.rightScore) {
    winnerId =
      game.currentGameState.leftScore > game.currentGameState.rightScore
        ? game.player1Uuid
        : game.player2Uuid;
  }

  const response = await fetch(`http://localhost:5173/api/match/${matchUuid}`, {
    // TODO: hardcoded localhost
    method: 'PATCH',
    headers: {
      'x-api-key': env.ADMIN_API_KEY,
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      score1: game.currentGameState.leftScore,
      score2: game.currentGameState.rightScore,
      winnerId,
      status: 'finished',
    }),
  });
  if (!response.ok) {
    throw new Error(
      `Posting finished tournament match failed: ${response.status} ${response.statusText}`
    );
  }
}

export async function fetchMatchParticipants(matchUuid: string) {
  // fetch from API
  const response = await fetch(
    `http://localhost:5173/api/match/${matchUuid}/participants`,
    {
      // TODO: hardcoded localhost
      method: 'GET',
      headers: {
        'x-api-key': env.ADMIN_API_KEY,
      },
      credentials: 'include',
    }
  );
  if (!response.ok) {
    throw new Error(
      `Fetching tournament match participants failed: ${response.status} ${response.statusText}`
    );
  }
  const participants = (await response.json()) as MatchParticipantsResponse;
  return participants;
}
