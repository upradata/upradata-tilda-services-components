#!/usr/bin/env bash

mode=$1
webpack-cli --mode $mode

outputdir="bundle/global"
outputname="mt-services"

echo "Adding 'var mt = mt || {}' in $outputdir/{es5,esm}/$outputname.{es5,esm}.js"

for ecma in es5 esm; do
    echo "var mt = window.mt || {};$(cat $outputdir/$ecma/$outputname.$ecma.js)" >$outputdir/$ecma/$outputname.$ecma.js
done
