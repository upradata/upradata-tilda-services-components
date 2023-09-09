#!/usr/bin/env bash

# shift # eat first argument being the command name
webpack-cli "$@" # fwd all arguments
# mode=$1
# webpack-cli --mode $mode

outputdir="./bundle/global"

for outputname in "tilda-global" "tilda"; do
    echo "Adding 'var mt = mt || {}' in $outputdir/{es5,esm}/$outputname.{es5,esm}.js"

    for ecma in es5 esm; do
        echo "var mt = window.mt || {};$(cat $outputdir/$ecma/$outputname.$ecma.js)" >$outputdir/$ecma/$outputname.$ecma.js
    done
done
