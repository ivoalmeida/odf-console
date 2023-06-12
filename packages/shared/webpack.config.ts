/* eslint-env node */
import * as path from 'path';
import { ForkTsCheckerWebpackPlugin } from 'fork-ts-checker-webpack-plugin/lib/plugin';
import * as webpack from 'webpack';
import type { Configuration as DevServerConfiguration } from 'webpack-dev-server';

const NODE_ENV = (process.env.NODE_ENV ||
  'development') as webpack.Configuration['mode'];

const config: webpack.Configuration & DevServerConfiguration = {
  context: __dirname,
  mode: NODE_ENV,
  entry: {},
  output: {
    path: path.resolve('./build'),
    filename: '[name]-bundle.js',
    chunkFilename: '[name]-chunk.js',
  },
  ignoreWarnings: [(warning) => !!warning?.file?.includes('shared module')],
  watchOptions: {
    ignored: ['node_modules', 'build'],
  },
  devServer: {
    port: 9010,
    devMiddleware: {
      writeToDisk: true,
    },
    static: ['build'],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /(\.jsx?)|(\.tsx?)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'thread-loader',
            options: {
              ...(NODE_ENV === 'development'
                ? { poolTimeout: Infinity, poolRespawn: false }
                : {}),
            },
          },
          {
            loader: 'ts-loader',
            options: {
              configFile: path.resolve(__dirname, 'tsconfig.json'),
              transpileOnly: true,
              happyPackMode: true,
            },
          },
        ],
      },
      {
        test: /\.scss$/,
        include: [
          /node_modules\/@openshift-console\/plugin-shared/,
          /node_modules\/@openshift-console\/dynamic-plugin-sdk/,
          /packages/,
        ],
        use: [
          { loader: 'cache-loader' },
          {
            loader: 'thread-loader',
            options: {
              ...(NODE_ENV === 'development'
                ? { poolTimeout: Infinity, poolRespawn: false }
                : {}),
            },
          },
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
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),
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
  devtool: 'cheap-module-source-map',
  optimization: {
    chunkIds: 'named',
  },
};

export default config;
