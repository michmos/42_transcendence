import WSocket from './Socket.js';

class RoomManager {
  private _rooms = new Map<string, __Room>();

  /**
   * Joins the specified socket to the room
   * and creates a new room if not previously
   * existing
   * @param socket The socket to join.
   * @param roomName The name of the room to join.
   */
  public joinRoom(socket: WSocket, roomName: string) {
    let room = this._rooms.get(roomName);
    if (!room) {
      // create new room
      room = new __Room(roomName);
      this._rooms.set(roomName, room);
    }
    room.addSocket(socket);
    return room.toPublicInterface();
  }

  /**
   * Removes the specified socket from the room
   * and closes the room if last client left
   * @param socket The socket to leave.
   * @param roomName The name of the room to leave from
   * @throws If room does not exist, or client not in room
   */
  public leaveRoom(socket: WSocket, roomName: string) {
    const room = this._rooms.get(roomName);
    if (!room) {
      throw new Error(`Cannot leave room \`${roomName}\`: doesn't exist`);
    }
    room.removeSocket(socket);
    if (room.size() === 0) {
      this._rooms.delete(room.name);
    }
  }

  public leaveAllRooms(socket: WSocket) {
    this._rooms.forEach((room) => {
      if (room.has(socket)) {
        this.leaveRoom(socket, room.name);
      }
    });
  }

  public get(roomName: string): Room | undefined {
    return this._rooms.get(roomName)?.toPublicInterface();
  }
}

export interface Room {
  name: string;
  getData(): object;
  setData(data: object): void;
  size(): number;
  has(socket: WSocket): boolean;
  broadcast(message: string): void;
}

class __Room {
  public name: string;
  private data: object = {};
  private sockets = new Set<WSocket>();

  constructor(name: string) {
    this.name = name;
  }

  public getData() {
    return this.data;
  }

  public setData(data: object) {
    this.data = data;
  }

  /**
   * add client to room
   */
  public addSocket(socket: WSocket) {
    this.sockets.add(socket);
  }

  /**
   * remove client from room
   * @throw if client not in room
   */
  public removeSocket(socket: WSocket) {
    this.sockets.delete(socket);
  }

  public removeAllSockets() {
    this.sockets.forEach((socket) => {
      this.removeSocket(socket);
    });
  }

  public broadcast(message: string) {
    this.sockets.forEach((socket) => {
      socket.send(message);
    });
  }

  public size() {
    return this.sockets.size;
  }

  public has(socket: WSocket) {
    return this.sockets.has(socket);
  }

  public toPublicInterface(): Room {
    return {
      name: this.name,
      getData: () => this.getData(),
      setData: (data: object) => this.setData(data),
      size: () => this.size(),
      has: (socket: WSocket) => this.has(socket),
      broadcast: (message: string) => this.broadcast(message),
    };
  }
}

export default new RoomManager();
