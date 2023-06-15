/* eslint-env node */
import * as fs from 'fs';
import * as path from 'path';
import { ForkTsCheckerWebpackPlugin } from 'fork-ts-checker-webpack-plugin/lib/plugin';

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
 */
// fs.existsSync(path);
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
//     let exports = [];
//     files.every(function (file) {
//       if (fs.existsSync(file) && fs.lstatSync(file).isDirectory()) {
//         return generateIndexes(file);
//       }
//       // if (fs.existsSync('index.ts')) return;

//       // Do whatever you want to do with the file
//       console.log(file);
//       // fs.readdir('./src/' + file, (err, dfiles)=>{})
//     });
//   });
// }
// generateIndexes();
// console.log(fileNames);

// function throughDirectory(directory) {
//   fs.readdirSync(directory).forEach((File) => {
//     const absolute = path.join(directory, File);
//     if (fs.statSync(absolute).isDirectory()) return throughDirectory(absolute);
//     else console.log(absolute);
//   });
// }

// throughDirectory(path.resolve('./src'));

const pkg = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, 'package.json'), {
    encoding: 'utf-8',
  })
);

const config = {
  entry: {
    // Nodes: './src/Nodes/index.ts',
    // alert: './src/alert/index.ts',
    // charts: './src/charts/index.ts',
    // models: './src/models/index.ts',
    // queries: './src/queries/index.ts',
    // selectors: './src/selectors/index.ts',
    // topology: './src/topology/index.ts',
    // types: './src/types/index.ts',
    //utils: './src/utils/dashboard.ts',
    // constants: './src/constants/index.ts',
    // 'form-group-controller': './src/form-group-controller/index.ts',
    // 'input-with-requirements': './src/input-with-requirements/index.ts',
    // useCustomTranslationHook: './src/useCustomTranslationHook.ts',
    //     'yup-validation-resolver': './src/yup-validation-resolver/index.ts',
    // index: [
    //   './src/useCustomTranslationHook.ts',
    //   './src/yup-validation-resolver/index.ts',
    // ],
    useCustomTranslationHook: './src/useCustomTranslationHook.ts',
    'yup-validation-resolver': './src/yup-validation-resolver/index.ts',
    index: './src/index.ts',
  },
  output: {
    path: path.resolve(__dirname, './build'),
    filename: '[name].js',
    chunkFilename: '[name]-chunk.js',
    library: {
      type: 'module',
    },
  },
  experiments: {
    outputModule: true,
  },
  watchOptions: {
    ignored: ['node_modules', 'build'],
  },
  externals: pkg.dependencies,
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
