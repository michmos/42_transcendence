import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  clientPrefix: 'VITE_', // <- changed
  client: {
    VITE_SOCKET_URL: z.string().nonempty({ message: 'SOCKET_URL is required' }),
    VITE_API_URL: z.string().nonempty({ message: 'API_URL is required' }),
  },
  server: {
    PORT: z.coerce.number().default(5173),
    API_SERVER: z.string().nonempty({ message: 'API_SERVER is required' }),
    SOCKET_SERVER: z
      .string()
      .nonempty({ message: 'SOCKET_SERVER is required' }),
    SWAGGER_SERVER: z
      .string()
      .nonempty({ message: 'SWAGGER_SERVER is required' }),
    SOCKET_URL: z.string().nonempty({ message: 'SOCKET_URL is required' }),
    API_URL: z.string().nonempty({ message: 'API_URL is required' }),
    CDN_PORT: z.number().default(3008),
  },
  runtimeEnv: import.meta.env,
});
