import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import webpack from 'webpack';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import { fromRoot } from '@upradata/node-util';
import { ensureArray } from '@upradata/util';
import { babelE5Config } from './babel.config.es5';
import { babelEsmConfig } from './babel.config.esm';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import * as threadLoader from 'thread-loader';

export type Ecma = 'es5' | 'esm';
export type OutputType = 'global' | 'lib';
export type Mode = 'production' | 'development';

export interface Options {
    ecmas: Ecma | Ecma[];
    outputs: OutputType | OutputType[];
    mode: Mode;
}

const getComponentsEntry = async (fromDir: string): Promise<{ entry: string; path: string; }[]> => {
    // const srcDir = fromRoot('src/components');

    const files = await fs.readdir(fromDir, { withFileTypes: true });
    const componentFiles = files.filter(file => file.isFile() && file.name.endsWith('.component.ts'));
    const directories = files.filter(file => file.isDirectory());

    const entries = componentFiles.map(file => ({ entry: file.name.replace(/\.component\.ts$/, ''), path: path.join(fromDir, file.name) }));
    const nextEntries = await Promise.all(directories.map(dir => getComponentsEntry(path.join(fromDir, dir.name)))).then(entries => entries.flat());

    return [ ...entries, ...nextEntries ];
};


export default async function webpackConfig(options: Partial<Options> = {}, argv: webpack.Configuration) {
    const componentEntries = await getComponentsEntry(fromRoot('src/components'));
    const componentEntriesWebpack = Object.fromEntries(componentEntries.map(({ entry, path }) => [ entry, path ]));

    /*  const threadLoaderOptions = {
         // there should be 1 cpu for the fork-ts-checker-webpack-plugin
         workers: os.cpus().length - 1,
         poolTimeout: Infinity // set this to Infinity in watch mode - see https://github.com/webpack-contrib/thread-loader
     };
 
     threadLoader.warmup(
         threadLoaderOptions,
         // pool options, like passed to loader options
         // must match loader options to boot the correct pool
         [
             // modules to load
             // can be any module, i. e.
             'babel-loader',
             'ts-loader',
         ]
     ); */

    const config: (options: { mode: Mode, ecma: Ecma, output: OutputType; }) => webpack.Configuration = options => {
        const { mode, ecma, output } = options;

        return {
            stats: {
                all: true
            }, // 'normal',
            mode,
            devtool: mode === 'development' ? 'eval-source-map' : 'source-map',
            /* output: {
                filename: '[name].[chunkhash].bundle.js',
                path: '.', // path.resolve(__dirname, 'dist')
            }, */
            context: fromRoot(),
            entry: {
                tilda: fromRoot('src/index.ts'),
                'tilda-services': fromRoot('src/services/global/index.ts'),
                'tilda-component': fromRoot('src/components/index.ts'),
                ...componentEntriesWebpack
            },
            output: {
                path: fromRoot('bundle', output, ecma),
                filename: `[name].${ecma}.js`,
                // library: 'mt', // this would be better then globalObject because it is generating var mt = ...
                // but it would replace a possible already defined variable mt.
                // so we us globalObject that is assuming the existence of the variable mt
                // thereby, we will add var mt = mt || {} at the beggining with a package.json script after build process
                libraryTarget: output === 'global' ? 'global' : undefined,
                globalObject: output === 'global' ? 'mt' : undefined
            },
            resolve: {
                mainFields: [ 'module', 'main', 'browser' ],
                extensions: [ '.ts', '.tsx', '.js', '.jsx' ],
                symlinks: true
            },
            module: {
                rules: [
                    {
                        test: /\.tsx?$/,
                        exclude: /node_modules/,
                        use: [
                            /*  {
                                 loader: 'thread-loader',
                                 options: threadLoaderOptions
                             }, */
                            { loader: 'babel-loader', options: ecma === 'es5' ? babelE5Config : babelEsmConfig },
                            {
                                loader: 'ts-loader',
                                options: {
                                    configFile: fromRoot(`tsconfig.src.${ecma}.json`),
                                    // happyPackMode: true, // IMPORTANT! use happyPackMode mode to speed-up compilation and reduce errors reported to webpack
                                    // transpileOnly: true // plugin ForkTsCheckerWebpackPlugin will run type checking in a different thread
                                }
                            }
                        ].filter(e => !!e)
                    },
                    {
                        test: /\.m?js$/,
                        exclude: /node_modules|bower_components|(Libraries\/Util)/,
                        use: { loader: 'babel-loader', options: ecma === 'es5' ? babelE5Config : babelEsmConfig }
                    }
                ],
            },
            externals: {
                // jquery: 'jQuery'
            },
            plugins: [
                /* new ForkTsCheckerWebpackPlugin({
                    typescript: {
                        diagnosticOptions: {
                            semantic: true,
                            syntactic: true
                        },
                        configFile: fromRoot(`tsconfig.src.${ecma}.json`),
                        mode: 'write-tsbuildinfo'
                    }
                }), */
                // new CleanWebpackPlugin(/* { dangerouslyAllowCleanPatternsOutsideProject: true, dry: false } */),
                // new webpack.debug.ProfilingPlugin()
                new webpack.ProgressPlugin({
                    activeModules: false,
                    entries: true,
                    /* handler(percentage, message, ...args) {
                        // custom logic
                    }, */
                    modules: true,
                    modulesCount: 5000,
                    profile: false,
                    dependencies: true,
                    dependenciesCount: 10000,
                    percentBy: null
                })
            ],
            optimization: {
                moduleIds: 'named', // NamedModulesPlugin()
                // minimize: isDefined(minimize) ? minimize : options.mode === 'production',
                /*  runtimeChunk: {
                     name: 'webpack-runtime'
                 }, */
                splitChunks: {
                    cacheGroups: {
                        babel: {
                            test: /node_modules\/(@babel|core-js|regenerator-runtime|webpack)/,
                            name: 'babel-polyfills',
                            chunks: 'all',
                            enforce: true,
                            minSize: 20000,
                            priority: 2
                        },
                        vendor: {
                            test: /node_modules/,
                            name: 'vendor',
                            chunks: 'all',
                            enforce: true,
                            minSize: 20000,
                            priority: 1
                        }
                    }
                },
                minimize: mode === 'production',
                minimizer: [
                    new TerserPlugin({
                        parallel: true,
                        terserOptions: { // https://github.com/babel/preset-modules => preset-modules is enabled also with options { bugfixes: true} in @babel/preset-env
                            sourceMap: true, // Must be set to true if using source-maps in production
                            ecma: 2017, // to override compress and format's ecma options
                            safari10: true // to work around Safari 10/11 bugs in loop scoping and await
                        }
                    }),
                ],
            }
        };
    };

    const configs: webpack.Configuration[] = [];

    for (const ecma of ensureArray(options.ecmas)) {
        for (const output of ensureArray(options.outputs))
            configs.push(config({ mode: options.mode, ecma, output }));
    }

    return configs;
}
