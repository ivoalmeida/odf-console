/* eslint-env node */
import * as fs from 'fs';
import * as path from 'path';

// const isDirectory = (dirPath: fs.PathLike) =>
//   fs.existsSync(dirPath) && fs.lstatSync(dirPath).isDirectory();

/**
 * go to each directory on src
 * if an index file exists continues
 * else
 *  get list of files of current folder
 *  create index file
 *  write to it:
 *  export * from 'each-file-of-current-foilder'
 */ fs.existsSync(path);
// const fileNames = fs.readdirSync('./src').reduce(
//   (acc, v) =>
//     isDirectory(`./src/${v}`) && fs.existsSync(`./src/${v}/index.ts`)
//       ? { ...acc, [v]: `./src/${v}/index.ts` }
//       : {
//           ...acc,
//           [v.replace(/\.[^.]*$/, '')]: `./src/${v}`,
//         },
//   {}
// );

// function generateIndexes() {
//   fs.readdir('./src', function (err, files) {
//     //handling error
//     if (err) {
//       return console.log('Unable to scan directory: ' + err);
//     }
//     //listing all files using forEach
//     files.forEach(function (file) {
//       // Do whatever you want to do with the file
//       console.log(file);
//       fs.readdir('./src/' + file, (err, dfiles)=>{})
//     });
//   });
// }
// generateIndexes();
// console.log(fileNames);

const config = {
  entry: {
    // Nodes: './src/Nodes/index.ts',
    // alert: './src/alert/index.ts',
    // charts: './src/charts/index.ts',
    // constants: './src/constants/index.ts',
    // 'form-group-controller': './src/form-group-controller/index.ts',
    // 'input-with-requirements': './src/input-with-requirements/index.ts',
    // models: './src/models/index.ts',
    // queries: './src/queries/index.ts',
    // selectors: './src/selectors/index.ts',
    // topology: './src/topology/index.ts',
    // types: './src/types/index.ts',
    // useCustomTranslationHook: './src/useCustomTranslationHook.ts',
    // utils: './src/utils/index.ts',
    'yup-validation-resolver': './src/yup-validation-resolver/index.ts',
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
              ...(process.env.NODE_ENV === 'development'
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
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@odf/shared': path.resolve(__dirname, './src/'),
    },
  },
};

export default config;
