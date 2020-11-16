#!/usr/bin/env bash;

import fs from 'fs-extra';
import path from 'path';
// import { ParseArgs, CustomArgs } from '@upradata/node-util';
import Yargs from 'yargs';
import webpack from 'webpack';
import { yellow, red, fromRoot, readFileAsync, writeFileAsync } from '@upradata/node-util';
import { ensureArray } from '@upradata/util';
import { MultiStats } from './webpack.multistats';
import webpackConfig, { Options } from './webpack.config';


if (process.argv[ 0 ].split('/').slice(-1)[ 0 ] === 'ts-node')
    process.argv.shift(); // called with ts-node

if (process.argv0 === 'node') {
    process.argv.shift(); // called with ts-node or node
}


type Opts = Options & { [ webpackOption: string ]: unknown; };

const yargs = Yargs(process.argv) as Yargs.Argv<Opts>; // new ParseArgs<any>() as ParseArgs<any>;

// yargs.command([ 'run', '$0' ], 'webpack compile', (args: CustomArgs<any>) => {
// const yargs = args.customYargs;

yargs.option('outputs', {
    type: 'array',
    describe: 'global or lib output'
});

yargs.option('ecmas', {
    type: 'array',
    describe: 'es5 or esm compilation'
});

yargs.option('mode', {
    choices: [ 'development', 'production' ],
    describe: 'webpack mode type'
});

// }, argv => {
console.log('Webpack compilation');

// argv.yargs.invalidParamsAndExit(argv); we want webpack options to be forwarded!!
const options = yargs.help().argv;

options.mode = options.mode || 'development';
// mode = mode === 'none' ? 'development' : mode;

options.ecmas = options.ecmas || [ 'es5', 'esm' ];
options.outputs = options.outputs || [ 'global', 'lib' ];

(async function run() {
    compile(options);
})();

// });


async function compile(options: Opts) {
    process.chdir(fromRoot());

    const configs = await webpackConfig(options, options);

    if (configs.length === 0) {
        console.warn(yellow`No webpack config has been built woth the following options:`, options);
        return;
    }

    const compilers = webpack(configs);

    // compilers.run(() => { });
    /* compilers.compilers.forEach(compiler => {
        compiler.hooks.afterEmit.tapAsync('Webpack Compile', (compilation, callback) => {
            for (const outname of Object.keys(compilation.assets)) {
                const asset = compilation.assets[ outname ];

                // if (asset.emitted)
                console.log(outname);
            }
            callback();
        });
    }); */
    if (options.watch)
        compilers.watch({ aggregateTimeout: 100 }, compileDone);
    else
        compilers.run(compileDone);
}


async function compileDone(err: Error, stats: MultiStats) {

    const clean = (err?: any) => {
        if (err) {
            console.error(red`${err.stack}`);
            console.error(red`${err.details || err}`);
        }
    };

    if (err)
        return clean(err);

    // Look here to see the options webpack/lib/stats/DefaultStatsPresetPlugin.js
    console.log(stats.toString({  /* preset: 'minimal''detailed', */ colors: true }));

    const info = stats.toJson();

    if (stats.hasErrors()) {
        const errs = info.errors;

        if (errs && errs.length > 0) {
            errs.forEach(clean);
        }
    }

    if (stats.hasWarnings())
        console.warn(yellow`${info.warnings}`);

    await addMtPrefix();
}

function addMtPrefix() {

    const outputDir = fromRoot('./bundle/global');

    // for (const outputType of [ 'tilda', 'tilda-global' ] as const) {
    const ecmas = ensureArray(options.ecmas);
    console.log(yellow`Adding 'var mt = mt || {} in ${outputDir}/{${ecmas.join(',')}}`);

    return Promise.all(ecmas.map(async ecma => {

        const outputPath = path.join(outputDir, ecma);
        const files = await fs.readdir(outputPath, 'utf8');

        await Promise.all(files.map(async file => {
            console.log(`    --> ${file}`);
            const fileName = path.join(outputPath, file);

            const content = await readFileAsync(fileName, 'utf8');
            const newContent = `var mt = window.mt || {};${content}`;

            return writeFileAsync(fileName, newContent, 'utf8');
        }));
    }));
}
