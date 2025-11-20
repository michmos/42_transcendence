const SocketToRooms = new Map<WSocket, Set<Room>>();
const Rooms = new Map<string, Room>();
import WSocket from './Socket.js';

export class RoomManager {
  /**
   * Joins the specified socket to the room
   * and creates a new room if not previously
   * existing
   * @param socket The socket to join.
   * @param roomName The name of the room to join.
   */
  public joinRoom(socket: WSocket, roomName: string) {
    let room = Rooms.get(roomName);
    if (!room) {
      room = new Room(roomName);
      Rooms.set(roomName, room);
    }
    room.join(socket);
    return room;
  }

  /**
   * Removes the specified socket from the room
   * and closes the room if last client left
   * @param socket The socket to leave.
   * @param roomName The name of the room to leave from
   * @throws If room does not exist, or client not in room
   */
  public leaveRoom(socket: WSocket, roomName: string) {
    let room = Rooms.get(roomName);
    if (!room) {
      throw new Error(`Cannot leave room \`${roomName}\`: doesn't exist`);
    }
    room.leave(socket);
    if (room.size() === 0) {
      room.close();
    }
    return room;
  }

  public leaveAllRooms(socket: WSocket) {
    Rooms.forEach((room) => {
      if (room.has(socket)) {
        this.leaveRoom(socket, room.name);
      }
    });
  }

  public get(roomName: string): Room | undefined {
    return Rooms.get(roomName);
  }
}

class Room {
  public name: string;
  private data: any = {};
  private clients: Set<WSocket> = new Set();

  constructor(name: string) {
    this.name = name;
  }

  public getData() {
    return this.data;
  }

  public setData(data: any) {
    this.data = data;
  }

  /**
   * add client to room
   */
  public join(socket: WSocket) {
    // add to global
    let rooms =
      SocketToRooms.get(socket) ??
      SocketToRooms.set(socket, new Set()).get(socket);
    if (!rooms) {
      throw new Error(`socket could not be added to room: ${this.name}`);
    }
    rooms.add(this);
    // add to local
    this.clients.add(socket);
  }

  /**
   * remove client from room
   * @throw if client not in room
   */
  public leave(socket: WSocket) {
    this.clients.delete(socket);
    let rooms = SocketToRooms.get(socket);
    if (!rooms) {
      throw new Error(`socket not found`);
    }
    rooms.delete(this);
  }

  // remove room
  public close() {
    this.clients.forEach((socket) => {
      this.leave(socket);
    });
    Rooms.delete(this.name);
  }

  public broadcast(message: string) {
    this.clients.forEach((socket) => {
      if (socket.connected) {
        socket.send(message);
      }
    });
  }

  public size() {
    return this.clients.size;
  }

  public getConnections() {
    return [...this.clients];
  }
  public has(socket: WSocket) {
    return this.clients.has(socket);
  }
}

export default new RoomManager();
