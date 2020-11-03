export const babelEsmConfig = {
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
    plugins: [
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
    ]
};
