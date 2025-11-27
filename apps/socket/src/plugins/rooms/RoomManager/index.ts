const SocketToRooms = new WeakMap<WebSocket, Set<Room>>();
const Rooms = new Map<string, Room>();
import { type WebSocket } from 'ws';

class RoomManager {
  /**
   * Joins the specified socket to the room
   * and creates a new room if not previously
   * existing
   * @param socket The WebSocket client to join.
   * @param roomName The name of the room to join.
   */
  public joinRoom(socket: WebSocket, roomName: string) {
    let room = Rooms.get(roomName);
    if (!room) {
      Rooms.set(roomName, new Room(roomName));
      room = Rooms.get(roomName);
    }
    room!.join(socket);
  }

  /**
   * Removes the specified socket from the room
   * and closes the room if last client left
   * @param socket The WebSocket client to join.
   * @param roomName The name of the room to join.
   * @throws If room does not exist, or client not in room
   */
  public leaveRoom(socket: WebSocket, roomName: string) {
    const room = Rooms.get(roomName);
    if (!room) {
      throw new Error(`Cannot leave room \`${roomName}\`: doesn't exist`);
    }
    room.leave(socket);
    if (room.size() === 0) {
      room.close();
    }
  }

  public leaveAllRooms(socket: WebSocket) {
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
  private clients = new Set<WebSocket>();

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
  public join(socket: WebSocket) {
    // add to global
    const rooms =
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
  public leave(socket: WebSocket) {
    this.clients.delete(socket);
    const rooms = SocketToRooms.get(socket);
    if (!rooms) {
      throw new Error(`socket not found`);
    }
    rooms.delete(this);
  }

  // remove room from all clients, so that it can be garbage collected
  public close() {
    this.clients.forEach((socket) => {
      this.leave(socket);
    });
    Rooms.delete(this.name);
  }

  public broadcast(message: string) {
    this.clients.forEach((socket) => socket.send(message));
  }

  public size() {
    return this.clients.size;
  }

  public getConnections() {
    return [...this.clients];
  }
  public has(socket: WebSocket) {
    return this.clients.has(socket);
  }
}

export default new RoomManager();
