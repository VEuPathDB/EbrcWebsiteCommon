#!/bin/bash

file=/home/rdoherty/pconfLatest.json
updateFrequency=120

while true; do
  pconfDump.sh > ${file}.generating
  mv ${file}.generating ${file}
  chmod 777 ${file}
  sleep $updateFrequency
done