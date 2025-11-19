# WebSocket Room Management

## Structure

### Message structure

Each receiving socket message should have the following structure:

```json
// normal message
{
  "type": "join-room" | 'leave-room' | 'message'    // The message type
  "room": "string",                                 // The room identifier
  "data"?: {                                      // The payload data
    // event-specific data
  }
}
```

Incoming messages will be checked for that structure and rejected otherwise

### Room structure

Rooms can have all sorts of names since we might want to create many (e.g. a separate room for each match)
But somewhere the logic needs to be handled -> this is where handlers come into play
Each room name needs to follow the following structure:

```
room: <handlerName>:<extension>

//e.g.
room: tournament:main
room: tournament:c75f7c66-e858-47d6-bb82-7ea5547c800c
room: match:main
room: match:d13f7c68-e858-27d1-bb82-7333444c8003
```

So the room name specifies the handler!

When a new message is received, the handler name is extracted from the room name and the corresponding handler is invoked.

**Each handler is responsible for:**

- Validating if the room exists (and how to handle if not)
  (see further down)
- Handling the message according to its type

**What is already done preHandler:**

- Validate message
  - against type (see defined above)
  - messages of type 'leave-room' or 'message' are rejected if the socket is not part of the defined room
- A **main room** is created for each handler and each socket is automatically added to each main room on connection
  - e.g. room name `tournament:main` for handler `tournament`

## Usage

### Creating a new handler

1. add a directory under `src/sockets/roomHandlers/` with the handler name
   _! ATTENTION: this is the name that will be used to map the handler_
2. add your logic
   _important_: there must be an `index.ts` file with a default export of the following type:
   ```ts
   export default async function (
     socket: WebSocket,
     message: SocketMessage
   ): Promise<void> {
   ```
   this function will be called for every message that specifies that handler and will be given the socket and the message

That's all you need to do! The system will automatically pick up the new handler and route messages accordingly.

### extended socket API

To facilitate room management, the WebSocket object has been extended with the following methods:

```ts
  socket.join(name: string); // join room or create if not exists
  socket.leave(name: string); // leave room
  socket.leaveAll(); // leave all rooms
  socket.setData(data: any) // attach metadata to the socket
  socket.getData(); // retrieve metadata from the socket
  socket.isInRoom(name: string); boolean;
  socket.isOnline(): boolean;

```

### RoomManager API

The RoomManager is a singleton that should be used to all room-related operations that are not accessible via the socket API.

```ts
  import RoomManager from './SOMEPATH/plugins/rooms/RoomManager/index.js';

  RoomManager.get(`someExistingRoom`);                     // get the room instance
  RoomManager.get(`someExistingRoom`)?.setData(data:any);  // set room metadata
  RoomManager.get(`someExistingRoom`)?.getData();          // get room metadata
  RoomManager.get(`someExistingRoom`)?.close();            // close the room
  RoomManager.get(`someExistingRoom`)?.broadcast();        // broadcast a message to all room members
  RoomManager.get(`someExistingRoom`)?.size();             // get number of members in the room
  RoomManager.get(`someExistingRoom`)?.has(socket: WebSocket); // check if a socket is in the room
  RoomManager.get(`someExistingRoom`)?.getConnections();  // get all sockets in the room
```

## TODOs

- extract everything inside package maybe?
