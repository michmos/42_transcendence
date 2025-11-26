import { type FastifyInstance } from 'fastify';
import * as schemas from './validation.js';

export default async function (app: FastifyInstance): Promise<void> {
  app.post<{ Body: schemas.tournamentCreatedBody }>(
    '/main/broadcast',
    {
      schema: schemas.tournamentCreated,
    },
    async function (request) {
      // handling
      console.log(request.body);
    }
  );

  app.post<{
    Params: schemas.tournamentUpdatedParams;
    Body: schemas.tournamentUpdatedBody;
  }>(
    '/:uuid/broadcast',
    {
      schema: schemas.tournamentUpdated,
    },
    async function (request) {
      // hanlding
      console.log(request.params.uuid);
    }
  );
}
