import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const apiPort = env.API_PORT || '3002';
  const socketPort = env.SOCKET_PORT || '3001';
  const vitePort = parseInt(env.VITE_PORT || '5173');

  return {
    root: 'src',
    server: {
      host: '0.0.0.0',
      port: vitePort,
      proxy: {
        '^/api(/.*)?$': {
          target: `http://localhost:${apiPort}`,
          changeOrigin: false,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
        '/websocket': {
          target: `http://localhost:${socketPort}`,
          changeOrigin: true,
          secure: false,
          ws: true,
          rewrite: (path) => path.replace(/^\/websocket/, ''),
        },
      },
    },
    preview: {
      host: '0.0.0.0',
      port: vitePort,
    },
    build: {
      outDir: '../out',
      emptyOutDir: true,
    },
  };
});
