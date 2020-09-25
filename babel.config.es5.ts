export const babelE5Config = {
    ignore: [
        '**/core-js /**/*'
    ],
    sourceType: 'unambiguous',
    presets: [
        [
            '@babel/preset-env',
            {
                targets: '> 0.5%, last 2 versions, Firefox ESR, not dead, not ie 11, not ie_mob 11',
                modules: false,
                useBuiltIns: 'usage',
                corejs: 3
            }
        ]
    ],
    plugins: [
        [
            '@babel/plugin-external-helpers',
            {
                helperVersion: '^7.10.1'
            }
        ],
        [
            '@babel/plugin-transform-runtime',
            {
                absoluteRuntime: false,
                corejs: 3,
                helpers: false,
                regenerator: true,
                useESModules: false,
                version: '^7.10.1'
            }
        ]
    ]
};
