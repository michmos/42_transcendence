import fastifyPlugin from 'fastify-plugin';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';

export default fastifyPlugin(async function (fastify) {
  await fastify.register(fastifySwagger, {
    mode: 'static',
    specification: {
      path: './docs/api_spec.yaml', // Relative to project root
      baseDir: process.cwd(),
    },
  });

  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/documentation',
  });
});
