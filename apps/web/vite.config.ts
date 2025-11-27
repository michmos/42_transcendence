import { defineConfig } from 'vite';
import { env } from './src/env.js';

export default defineConfig(() => {
  return {
    root: 'src',
    server: {
      port: env.VITE_PORT,
      proxy: {
        '^/api(/.*)?$': {
          target: env.API_SERVER,
          changeOrigin: false,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
        '/websocket': {
          target: env.SOCKET_SERVER,
          changeOrigin: true,
          upgrade: true,
          secure: true,
          ws: true,
          rewrite: (path) => path.replace(/^\/websocket/, ''),
        },
        '/documentation': {
          target: env.SWAGGER_SERVER,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    preview: {
      port: env.VITE_PORT,
    },
    build: {
      outDir: '../out',
      emptyOutDir: true,
    },
  };
});
