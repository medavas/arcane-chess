import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs/promises';
import commonjs from 'vite-plugin-commonjs';

export default ({ mode }) => {
  // todo
  // Load app-level env vars to node-level env vars.
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  return defineConfig({
    // port: process.env.PORT || 8080,
    publicDir: 'public',
    resolve: {
      alias: {
        src: resolve(__dirname, 'src'),
        '@shared': resolve(__dirname, 'shared'),
      },
    },
    esbuild: {
      loader: 'tsx',
      include: /src\/.*\.tsx?$/,
      exclude: [],
    },
    build: {
      outDir: 'dist',
    },
    optimizeDeps: {
      esbuildOptions: {
        plugins: [
          {
            name: 'load-ts-files-as-tsx',
            setup(build) {
              build.onLoad({ filter: /src\\.*\.ts$/ }, async (args) => ({
                loader: 'tsx',
                contents: await fs.readFile(args.path, 'utf8'),
              }));
            },
          },
        ],
      },
    },
    plugins: [react(), commonjs()],
    server: {
      proxy: {
        '/api': {
          target: `http://localhost:${process.env.PORT || 8080}`,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  });
};
