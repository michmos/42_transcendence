import type { ClientRecord } from './index.js';
import { resetGame } from './game.js';
import { WSocket } from '../../plugins/rooms/WSocket/index.js';
import {
  PING,
  PING_TIMEOUT,
  ROLE_EXPIRATION,
  clientRecords,
  socketToClientId,
  gameState,
} from './index.js';

export function removeExpiredRoles() {
  const now = Date.now();

  for (const [clientId, record] of clientRecords.entries()) {
    if (
      !record.connected &&
      now - record.lastSeen > PING_TIMEOUT &&
      now - record.lastSeen < PING_TIMEOUT + PING
    ) {
      console.log(
        `${clientId} timed out (no input for ${now - record.lastSeen}ms)`
      );
      record.connected = false;
      record.webSocket = null;
    }
    if (!record.connected && now - record.lastSeen > ROLE_EXPIRATION) {
      if (record.role === 'player1' || record.role === 'player2') {
        console.log(`${clientId} role "${record.role}" expired and available`);
        if (record.role === 'player1') {
          convertPlayertoLocal(2);
        } else if (record.role === 'player2') {
          convertPlayertoLocal(1);
        }
      } else if (record.role === 'local') {
        console.log(`${clientId} has left the game`);
        resetGame();
      }
      clientRecords.delete(clientId);
    }
  }
}

function assignRole(): 'local' | 'player1' | 'player2' | 'spectator' {
  const connectedClients = Array.from(clientRecords.values()).filter(
    (r) => r.connected
  );
  const usedRoles = new Set(
    Array.from(clientRecords.values()).map((r) => r.role)
  );

  if (connectedClients.length === 0) {
    return 'local';
  }
  if (
    connectedClients.length > 0 &&
    connectedClients.every((r) => r.role === 'local')
  ) {
    return 'player2';
  }
  if (!usedRoles.has('player1')) {
    return 'player1';
  }
  if (!usedRoles.has('player2')) {
    return 'player2';
  }
  return 'spectator';
}

export function convertLocaltoPlayer() {
  // Find the first local player and convert them to player1
  for (const [clientId, record] of clientRecords.entries()) {
    if (record.connected && record.role === 'local') {
      record.role = 'player1';
      clientRecords.set(clientId, record);

      // Notify the client about their role change
      if (record.webSocket) {
        record.webSocket.send(
          JSON.stringify({
            type: 'role',
            role: 'player1',
            clientId: record.clientId,
          })
        );
      }
      console.log(`${clientId} converted from local to player1`);
      break; // Only convert the first one
    }
  }
}

export function convertPlayertoLocal(player: number) {
  // Find player1 and convert them back to local
  for (const [clientId, record] of clientRecords.entries()) {
    if (record.connected && record.role === `player${player}`) {
      record.role = 'local';
      clientRecords.set(clientId, record);

      // Notify the client about their role change
      if (record.webSocket) {
        record.webSocket.send(
          JSON.stringify({
            type: 'role',
            role: 'local',
            clientId: record.clientId,
          })
        );
      }
      console.log(`${clientId} converted from player${player} to local`);
      break;
    }
  }
}

export function attachClient(
  clientId: string,
  webSocket: WSocket
): ClientRecord {
  const now = Date.now();
  if (clientRecords.has(clientId)) {
    const record = clientRecords.get(clientId);
    if (record) {
      record.webSocket = webSocket;
      record.connected = true;
      record.lastSeen = now;
      clientRecords.set(clientId, record);
      socketToClientId.set(webSocket, clientId);
      return record;
    }
  }

  const role = assignRole();
  const record: ClientRecord = {
    clientId,
    role,
    webSocket,
    connected: true,
    lastSeen: now,
  };

  if (role === 'player2') {
    if (gameState.aiEnabled) {
      console.log('AI disabled');
      gameState.aiEnabled = false;
    }
    convertLocaltoPlayer();
  }

  clientRecords.set(clientId, record);
  socketToClientId.set(webSocket, clientId);
  return record;
}