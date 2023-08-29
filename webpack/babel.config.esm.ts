import type { TransformOptions as BabelOptions } from '@babel/core';

export const babelEsmConfig: BabelOptions = {
    ignore: [
        '**/core-js /**/*'
    ],
    sourceType: 'unambiguous',
    presets: [
        [
            '@babel/preset-env',
            {
                targets: { esmodules: true }, // When specifying this option, the browsers field will be ignored
                exclude: [ 'es.*', 'web.dom-collections.iterator', 'web.url' ],
                bugfixes: true,
                modules: false,
                useBuiltIns: 'usage',
                corejs: 3
            }
        ]
    ],
    // read https://github.com/babel/babel/issues/9853#issuecomment-619587386 why
    // We should not use useBuiltIns: 'usage' and corejs option on @babel/preset-env together with @babel/transform-runtime with core-js option set to false
    /*  plugins: [
         [
             '@babel/plugin-transform-runtime',
             {
                 absoluteRuntime: false,
                 corejs: false,
                 helpers: true,
                 regenerator: false,
                 useESModules: true,
                 version: '^7.11.5'
             }
         ]
     ] */
};
