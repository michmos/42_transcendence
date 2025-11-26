import RoomManager from './RoomManager.js';
import WSocket from './Socket.js';

let uuidToUser: Map<string, User> = new Map();

export function userIsOnline(uuid: string) {
  return uuidToUser.has(uuid);
}

export function getUser(socket: WSocket) {
  const existingUser = uuidToUser.get(socket.uuid);
  if (existingUser) {
    existingUser.addSocket(socket);
    return existingUser;
  }
  const newUser = new User(socket);
  uuidToUser.set(socket.uuid, newUser);
  return newUser;
}

export default class User {
  private sockets: Set<WSocket>;
  public uuid: string;

  constructor(socket: WSocket) {
    this.sockets = new Set();
    this.sockets.add(socket);
    this.uuid = socket.uuid;
  }

  public addSocket(socket: WSocket) {
    this.sockets.add(socket);
  }

  public removeSocket(socket: WSocket) {
    this.sockets.delete(socket);
    if (this.sockets.size === 0) {
      uuidToUser.delete(this.uuid);
    }
  }

  public join(name: string) {
    let room;
    for (const socket of this.sockets) {
      room = RoomManager.joinRoom(socket, name);
    }
    return room;
  }

  public leave(name: string) {
    for (const socket of this.sockets) {
      RoomManager.leaveRoom(socket, name);
    }
  }

  public leaveAll() {
    for (const socket of this.sockets) {
      RoomManager.leaveAllRooms(socket);
    }
  }

  // communication
  public send(message: string) {
    for (const socket of this.sockets) {
      socket.send(message);
    }
  }

  public sendError(message: string) {
    for (const socket of this.sockets) {
      socket.sendError(message);
    }
  }

  public sendSuccess() {
    for (const socket of this.sockets) {
      socket.sendSuccess();
    }
  }

  public getConnectionCount() {
    return this.sockets.size;
  }
}
