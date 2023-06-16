/* eslint-env node */
import * as fs from 'fs';
import * as path from 'path';
import { ForkTsCheckerWebpackPlugin } from 'fork-ts-checker-webpack-plugin/lib/plugin';
import { Configuration } from 'webpack';

const pkg = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, 'package.json'), {
    encoding: 'utf-8',
  })
);

const config: Configuration = {
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, './build'),
    filename: 'index.js',
    chunkFilename: '[name]-chunk.js',
    library: {
      type: 'module',
    },
    clean: true,
  },
  experiments: {
    outputModule: true,
  },
  watchOptions: {
    ignored: ['node_modules', 'build'],
  },
  externals: pkg.dependencies,
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: path.resolve(__dirname, 'tsconfig.json'),
            transpileOnly: false,
            happyPackMode: false,
          },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.scss$/,
        use: [
          { loader: 'style-loader' },
          {
            loader: 'css-loader',
            options: {
              sourceMap: true,
            },
          },
          {
            loader: 'resolve-url-loader',
            options: {
              sourceMap: true,
            },
          },
          {
            loader: 'sass-loader',
            options: {
              sassOptions: {
                outputStyle: 'compressed',
                quietDeps: true,
              },
              sourceMap: true,
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|woff2?|ttf|eot|otf)(\?.*$|$)/,
        loader: 'file-loader',
        options: {
          name: 'assets/[name].[ext]',
        },
      },
    ],
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin({
      issue: {
        exclude: [{ file: '**/node_modules/**/*' }],
      },
      typescript: {
        diagnosticOptions: {
          semantic: true,
          syntactic: true,
        },
      },
    }),
  ],
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@odf/shared': path.resolve(__dirname, './src/'),
    },
  },
};

export default config;
