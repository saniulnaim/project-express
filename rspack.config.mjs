
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  mode: 'production', // Production build mode চালু করে

  target: 'node', // Browser নয়, Node.js environment-এর জন্য build করে

  entry: './src/server.ts', // src/server.ts থেকে build শুরু করে

  output: { // dist/server.cjs তৈরি করে
    path: path.resolve(__dirname, 'dist'),
    filename: 'server.cjs',
    clean: true, // নতুন build-এর আগে dist পরিষ্কার করে
  },

  externalsPresets: {
    node: true,
  },

  externalsType: 'commonjs',

  externals: [
    ({ request }, callback) => {
      if (
        request &&
        !request.startsWith('.') &&
        !path.isAbsolute(request)
      ) {
        return callback(null, `commonjs ${request}`);
      }

      callback();
    },
  ],

  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        loader: 'builtin:swc-loader',
        options: {
          jsc: {
            parser: {
              syntax: 'typescript',
            },
            target: 'es2022',
          },
        },
      },
    ],
  },

  resolve: {
    extensions: ['.ts', '.js', '.json'],
    extensionAlias: {
        '.js': ['.js', '.ts'],
    },
  },
};
