import { type FastifyInstance } from 'fastify';

export default async function (app: FastifyInstance): Promise<void> {
  app.get('/', async function (request, reply) {
    const { uuid } = request.params as { uuid: string };
    if (app.db.getUser(uuid) === null) {
      return reply.status(404).send({ error: 'User not found' });
    }
    return reply.status(200).send({ uuid });
  });
}
