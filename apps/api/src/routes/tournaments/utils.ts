import {
  type Tournament,
  status as statusEnum,
} from 'db/generated/client/index.js';
import { getUuid } from '../../plugins/auth/utils.js';
import Fastify, { type FastifyInstance } from 'fastify';
import * as schemas from './validationSchemas.js';

export async function isOpenTournament(
  uuid: string,
  app: FastifyInstance,
  reply: Fastify.FastifyReply
) {
  // is existing tournament
  const tournament: Tournament | null = await app.db.getTournament(uuid);
  if (!tournament) {
    reply.status(404).send({
      error: `Tournament with ${uuid} does not exist`,
    });
    return false;
  }
  // is open for joining
  if (tournament.status !== statusEnum.outstanding) {
    reply.status(422).send({
      error: `Tournament cannot be accessed: status: ${tournament.status}`,
    });
    return false;
  }
  return true;
}
