import RoomManager from './RoomManager.js';
import { type WebSocket } from 'ws';

export type SocketMetaData = {
  uuid?: string;
  lastSeen?: Date;
  connected?: boolean;
};

export default class WSocket {
  private socket: WebSocket;
  public uuid: string;
  public lastSeen?: Date;
  public connected: boolean;

  constructor(socket: WebSocket, uuid: string) {
    this.socket = socket;
    this.uuid = uuid;
    this.connected = true;
    this.socket.on('close', () => {
      this.connected = false;
      this.socket.close();
    });
  }

  public onClose(callback: () => void | Promise<void>) {
    this.socket.on('close', () => {
      console.log(`[${this.uuid}]: connection closed`);
      Promise.resolve(callback()).catch((error) =>
        console.error(`[${this.uuid}]: error on close: ${error}`)
      );
    });
  }

  public onMessage(callback: (input: Buffer) => void | Promise<void>) {
    this.socket.on('message', (input: Buffer) => {
      console.log(`[${this.uuid}]: new message`);
      Promise.resolve(callback(input)).catch((error) => {
        console.error(`[${this.uuid}]: error on message: ${error}`);
        this.sendError('Internal error');
      });
    });
  }

  // room operations
  public join(name: string) {
    RoomManager.joinRoom(this, name);
  }

  public leave(name: string) {
    RoomManager.leaveRoom(this, name);
  }

  public leaveAll() {
    RoomManager.leaveAllRooms(this);
  }

  public isInRoom(name: string) {
    return RoomManager.get(name)?.has(this) === true;
  }

  // data operations
  public set(data: Partial<SocketMetaData>) {
    if (data.uuid !== undefined) this.uuid = data.uuid;
    if (data.lastSeen !== undefined) this.lastSeen = data.lastSeen;
    if (data.connected !== undefined) this.connected = data.connected;
  }

  // communication
  public send(message: string) {
    this.socket.send(message);
  }

  public sendError(message: string) {
    this.send(JSON.stringify({ status: 'error', message }));
  }

  public sendSuccess() {
    this.send(JSON.stringify({ status: 'success' }));
  }

  // general
  public getSocketInstance() {
    return this.socket;
  }
}
