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
But somewhere the logic needs to be handled -> this is where room namespaces come into play
A room namespace is a logical group of rooms that share the same handling logic.

So we will have a game namespace for all game-related rooms, a tournament namespace for all tournament-related rooms, etc.
_The namespace is part of the room name, e.g. "game:<someGameUuid>" or "tournament:<someTournamentUuid>" (where game and tournament are the respective namespace)_

When a new message is received, the namespace is extracted from the room name and the corresponding handler is invoked. (Namespace and handler is thus kind of interchangable)

Each namespace handler is responsible for:

- Validating if the room exists (and how to handle if not)
  (see further down)
- Handling the message according to its type

What is already done preHandler:

- Validate message
  - against type (see defined above)
  - messages of type 'leave-room' or 'message' are rejected if the socket is not part of the defined room

## Usage

### Creating a new namespace

1. add a directory under `src/sockets/roomNs/` with the namespace name
2. add your logic
   _important_: there must be an `index.ts` file with a default export of the following type:
   ```ts
   export default async function (
     socket: WebSocket,
     message: SocketMessage
   ): Promise<void> {
   ```
   this function will be called for every message in that namespace and will be given the socket and the message

That's all you need to do! The system will automatically pick up the new namespace and route messages accordingly.

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
