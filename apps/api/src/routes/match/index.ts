import { type FastifyInstance } from 'fastify';
import * as schemas from './validation.js';

export default async function (app: FastifyInstance): Promise<void> {
  app.get<{ Params: schemas.singleUuidParam }>(
    '/:uuid',
    async (request, reply) => {
      const { uuid } = request.params;
      const match = await app.db.getMatch(uuid);
      if (!match) {
        return reply.status(404).send({ message: 'Match not found' });
      }
      return reply.status(200).send(match);
    }
  );
}
