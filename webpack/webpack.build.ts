#!/usr/bin/env bash

import fs from 'fs-extra';
import path from 'path';
import { promisify } from 'util';
import webpackConfig, { Options } from './../webpack.config';
// import { ParseArgs, CustomArgs } from '@upradata/node-util';
import Yargs from 'yargs';
import webpack from 'webpack';
import { yellow, red, fromRoot, readFileAsync, writeFileAsync } from '@upradata/node-util';
import { MultiStats } from './webpack.multistats';


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

compile(options);

// });


function compile(options: Opts) {
    process.chdir(fromRoot());

    const config = webpackConfig(options, options);
    const compilers = webpack(config);

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


function compileDone(err: Error, stats: MultiStats) {

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

    return addMtPrefix();
}

function addMtPrefix() {
    const promises: Promise<void>[] = [];

    const outputDir = fromRoot('./bundle/global');

    for (const outputType of [ 'tilda', 'tilda-global' ] as const) {
        console.log(yellow`Adding 'var mt = mt || {} in ${outputDir}/{es5,esm}/${outputType}.{es5,esm}.js`);

        for (const ecma of options.ecmas) {
            // echo "var mt = window.mt || {};$(cat $outputdir/$ecma/$outputname.$ecma.js)" >$outputdir/$ecma/$outputname.$ecma.js

            const fileName = path.join(outputDir, ecma, `${outputType}.${ecma}.js`);

            promises.push(
                readFileAsync(fileName, 'utf8').then(content => {
                    const newContent = `var mt = window.mt || {};${content}`;
                    return writeFileAsync(fileName, newContent, 'utf8');
                })
            );
        }
    }

    return Promise.all(promises);
}
