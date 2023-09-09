#!/usr/bin/env bash;

import fs from 'fs-extra';
import path from 'path';
// import { ParseArgs, CustomArgs } from '@upradata/node-util';
import Yargs from 'yargs';
import webpack from 'webpack';
import { yellow, red, fromRoot, forEachFiles, ForEachFilesInCallback, ForEachFilesOptions, green } from '@upradata/node-util';
import { ensureArray, toObject } from '@upradata/util';
import { MultiStats } from './webpack.multistats';
import webpackConfig, { Ecma, Options } from './webpack.config';


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
    await compile(options);
})();

// });


async function compile(options: Opts) {
    process.chdir(fromRoot());

    const configs = await webpackConfig(options, options);

    if (configs.length === 0) {
        console.warn(yellow`No webpack config has been built with the following options:`, options);
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
            console.error(err.stack);
            console.error(err.details || err);
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

    await appendWebpackRuntimeToTildaService();
    await addMtPrefix();

    console.log(green`Done!`);
}

async function addMtPrefix() {
    console.log(yellow`Assing "var mt" to ${fromRoot('/bundle/global')}`);

    return forEachFilesInOutput(async filepath => {
        console.log(`Add mt:    --> ${filepath.split('/').slice(-3).join('/')}`);

        const content = await fs.readFile(filepath, 'utf8');
        const newContent = `var mt = window.mt || {};${content}`;

        return fs.writeFile(filepath, newContent, 'utf8');
    });
}

async function appendWebpackRuntimeToTildaService() {
    console.log(yellow`Prepending webpack.runtime.js to tilda-services`);

    return forEachFilesInOutput(async (filepath, fileDirent) => {

        const dir = path.dirname(filepath);
        const ecma = dir.split('/').slice(-1)[ 0 ];

        const webpackRuntimeName = `webpack.runtime.${ecma}.js`;
        console.assert(webpackRuntimeName === fileDirent.name);

        // 'rs' bypasses the system local file cache https://nodejs.org/api/fs.html#fs_file_system_flags
        // we need it to write just after inside the same file
        const files = toObject(
            await Promise.all(([
                { name: 'runtime', path: path.join(dir, path.basename(filepath)) },
                { name: 'services', path: path.join(dir, `tilda-services.${ecma}.js`) }
            ] as const).map(async file => ({ ...file, content: file.name === 'runtime' ? await fs.readFile(file.path, 'utf8') : '' }))),
            'name');

        console.log(green`--> Prepending to ${path.relative(fromRoot(), files.services.path)}`);
        return fs.appendFile(files.services.path, files.runtime.content, { encoding: 'utf8' });

    }, { filterFiles: (filepath, _dir) => filepath.includes('runtime') });
}


async function forEachFilesInOutput(callback: ForEachFilesInCallback, opts: { filterFiles?: ForEachFilesOptions[ 'filterFiles' ]; } = {}) {
    const outputDir = fromRoot('./bundle/global');
    const { filterFiles = _ => true } = opts;

    const ecmas = ensureArray(options.ecmas) as Ecma[];
    const outputPaths = ecmas.map(ecma => path.join(outputDir, ecma));

    return forEachFiles(outputDir, {
        recursive: true,
        filterFiles: (filepath, dir) => outputPaths.some(p => filepath.includes(p) && filterFiles(filepath, dir))
    }, callback);
}
