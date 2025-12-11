import 'fastify';

// declare module 'fastify' {
//   interface FastifyRequest {
//     user: {
//       uuid: string;
//       email?: string;
//       username?: string;
//       avatar?: string;
//       role?: string;
//     };
//   }
// }

declare module 'fastify' {
  interface FastifyRequest {
    user: {
      uuid: string;
      role: string;
    };
  }
}

export {};
