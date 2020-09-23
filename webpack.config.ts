import { fromRoot } from '@upradata/node-util';
import webpack from 'webpack';

export default function webpackConfig(env: object, argv: webpack.Configuration) {

    const config: webpack.Configuration = {
        stats: 'verbose',
        // mode: 'development',
        devtool: argv.mode === 'development' ? 'eval-source-map' : 'source-map',
        /* output: {
            filename: '[name].[chunkhash].bundle.js',
            path: '.', // path.resolve(__dirname, 'dist')
        }, */
        context: fromRoot(),
        entry: {
            'mt-services': fromRoot('src/index.ts')
        },
        output: {
            path: fromRoot('dist-bundle'),
            filename: '[name].js',
            // library: 'mt',
            libraryTarget: 'global',
            globalObject: 'mt'
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
                        { loader: 'babel-loader' },
                        { loader: 'ts-loader' }
                    ].filter(e => !!e)
                },
                {
                    test: /\.m?js$/,
                    exclude: /(node_modules|bower_components)/,
                    use: { loader: 'babel-loader' }
                }
            ],
        },
        externals: {
            // jquery: 'jQuery'
        },
        plugins: [],
        optimization: {
            namedModules: true, // NamedModulesPlugin()
            // minimize: isDefined(minimize) ? minimize : options.mode === 'production',
            runtimeChunk: {
                name: 'webpack-runtime'
            },
            splitChunks: {
                cacheGroups: {
                    /* upradata: {
                        test: /node_modules\/@upradata/,
                        name: '@upradata',
                        chunks: 'all',
                        enforce: true,
                        priority: 3
                    }, */
                    es6: {
                        test: /node_modules\/(@babel|core-js|regenerator-runtime)/,
                        name: 'es6-polyfills',
                        chunks: 'all',
                        enforce: true,
                        priority: 2
                    },
                    vendor: {
                        test: /node_modules/,
                        name: 'vendor',
                        chunks: 'all',
                        enforce: true,
                        priority: 1
                    }
                }
            }
        }
    };

    return config;
}
