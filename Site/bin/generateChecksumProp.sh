#!/usr/bin/env bash

cd $WEBAPP;

ASSETS=`find . -name *.js -o -name *.css -o -name *.jpg -o -name *.jpeg -o -name *.png -o -name *.gif`

# generate checksums, strip leading dir chars, swap columns and join with "=", then write to props file
md5sum $ASSETS | sed 's:\./::' | awk '{OFS = "="}{print $2, $1}'
