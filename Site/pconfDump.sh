#!/bin/bash

date=$(date)
echo "{\"lastUpdated\":\"$(date)\",\"stacks\":{"
for stack in `sudo pconf | tail -n +15`; do
  echo "\"$stack\":["
  echo `sudo pconf $stack | sed 's/^}$/},/g'`
  echo "{}],"
done
echo "\"empty\":[]}}"
