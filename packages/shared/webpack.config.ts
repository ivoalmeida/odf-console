/* eslint-env node */
import * as fs from 'fs';
import * as path from 'path';

const isDirectory = (dirPath: fs.PathLike) =>
  fs.existsSync(dirPath) && fs.lstatSync(dirPath).isDirectory();

const fileNames = fs.readdirSync('./src').reduce(
  (acc, v) =>
    isDirectory(`./src/${v}`)
      ? { ...acc, [v]: `./src/${v}/index.ts` }
      : {
          ...acc,
          [v.replace(/\.[^.]*$/, '')]: `./src/${v}`,
        },
  {}
);

console.log(fileNames);

const config = {
  entry: {
    types: './src/types/index.ts',
  },
  output: {
    path: path.resolve('./build'),
    filename: '[name].js',
    chunkFilename: '[name]-chunk.js',
  },
  mode: process.env.NODE_ENV || 'development',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: path.resolve(__dirname, 'tsconfig.json'),
            transpileOnly: true,
            happyPackMode: true,
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@odf/shared': path.resolve(__dirname, './src/'),
    },
  },
};

export default config;
