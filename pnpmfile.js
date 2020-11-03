module.exports = {
    hooks: {
        readPackage
    }
};

function readPackage(pkg, context) {
    // Override the manifest of foo@1 after downloading it from the registry
    // Replace all dependencies with bar@2
    if (pkg.name === 'foo' && pkg.version.startsWith('1.')) {
        pkg.dependencies = {
            bar: '^2.0.0'
        };
        context.log('bar@1 => bar@2 in dependencies of foo');
    }

    // This will fix any dependencies on baz to 1.2.3
    /* if (pkg.dependencies && pkg.dependencies.baz === '*') {
      pkg.dependencies.baz = '1.2.3';
    } */

    const dep = pkg.dependencies || pkg.devDependencies || {};

    if (dep['@types/webpack']) {
        // context.log(pkg);
        context.log(`Delete "'@types/webpack': ${dep['@types/webpack']}" from package "${pkg.name}" because typedef already exists inside webpack package`);
        delete dep['@types/webpack'];
        // context.log(pkg);
    }

    return pkg;
}
