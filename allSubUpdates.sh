#!/bin/bash

TOP=$PWD

MODS=$(find . -name .gitmodules -printf "%d %p\n" | sort -n | sed -e "s/[0-9]\+ \(.*\)\.gitmodules/\\1/");
    
for m in $MODS; do
    if [ $(echo $m | grep -c "build") -gt 0 ]; then
       continue
    fi
    echo $m;
    cd $TOP/$m;
    git submodule update;
done

