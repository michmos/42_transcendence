import { type FastifyInstance } from 'fastify';
import * as schemas from './validation.js';
import { User } from '../../plugins/rooms/WSocket/index.js';
import { getUserByUuid } from '../../plugins/rooms/WSocket/User.js';

export default function (app: FastifyInstance): void {
  app.post<{ Body: schemas.requestEventBody }>(
    '/',
    {
      schema: schemas.requestEvent,
    },
    async function (request, reply) {
      const user: User | undefined = getUserByUuid(request.body.uuid);
      if (user) {
        user.send(
          JSON.stringify({
            event: request.body.event,
          })
        );
      }
      return reply.status(200).send();
    }
  );
}
