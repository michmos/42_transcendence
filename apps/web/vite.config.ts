import { defineConfig } from 'vite';
import { env } from './src/env.js';

export default defineConfig(() => {
  return {
    root: 'src',
    server: {
      host: '0.0.0.0',
      port: env.PORT,
      proxy: {
        '/api': {
          target: env.API_SERVER,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
        '/websocket': {
          target: env.SOCKET_SERVER,
          changeOrigin: true,
          secure: false,
          ws: true,
          rewrite: (path) => path.replace(/^\/websocket/, ''),
        },
        '/documentation': {
          target: env.SWAGGER_SERVER,
          changeOrigin: true,
          secure: false,
        },
        '/cdn': {
          target: `http://localhost:${cdnPort}`,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    preview: {
      port: env.PORT,
    },
    build: {
      outDir: '../out',
      emptyOutDir: true,
    },
  };
});
