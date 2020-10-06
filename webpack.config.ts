import { babelE5Config } from './babel.config.es5';
import { babelEsmConfig } from './babel.config.esm';
import { fromRoot } from '@upradata/node-util';
import TerserPlugin from 'terser-webpack-plugin';
import webpack from 'webpack';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';


export default function webpackConfig(env: object, argv: webpack.Configuration) {

    const config: (options: { mode: 'production' | 'development', ecma: 'es5' | 'esm', output: 'global' | 'lib'; }) => webpack.Configuration = options => {
        const { mode, ecma, output } = options;

        return {
            stats: 'verbose',
            mode,
            devtool: mode === 'development' ? 'eval-source-map' : 'source-map',
            /* output: {
                filename: '[name].[chunkhash].bundle.js',
                path: '.', // path.resolve(__dirname, 'dist')
            }, */
            context: fromRoot(),
            entry: {
                tilda: fromRoot('src/index.ts'),
                'tilda-global': fromRoot('src/services/global/index.ts')
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
                            { loader: 'babel-loader', options: ecma === 'es5' ? babelE5Config : babelEsmConfig },
                            { loader: 'ts-loader' }
                        ].filter(e => !!e)
                    },
                    {
                        test: /\.m?js$/,
                        exclude: /(node_modules|bower_components)/,
                        use: { loader: 'babel-loader', options: ecma === 'es5' ? babelE5Config : babelEsmConfig }
                    }
                ],
            },
            externals: {
                // jquery: 'jQuery'
            },
            plugins: [
                new CleanWebpackPlugin()
            ],
            optimization: {
                namedModules: true, // NamedModulesPlugin()
                // minimize: isDefined(minimize) ? minimize : options.mode === 'production',
                runtimeChunk: {
                    name: 'webpack-runtime'
                },
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
                        cache: true,
                        parallel: true,
                        sourceMap: true, // Must be set to true if using source-maps in production
                        terserOptions: { // https://github.com/babel/preset-modules => preset-modules is enabled also with options { bugfixes: true} in @babel/preset-env
                            ecma: 8, // to override compress and format's ecma options
                            safari10: true // to work around Safari 10/11 bugs in loop scoping and await
                        }
                    }),
                ],
            }
        };
    };

    let mode = argv.mode || 'development';
    mode = mode === 'none' ? 'development' : mode;

    const configs: webpack.Configuration[] = [];

    for (const ecma of [ 'es5', 'esm' ] as const) {
        for (const output of [ 'global', 'lib' ] as const)
            configs.push(config({ mode, ecma, output }));
    }

    return configs;
}
