#!/bin/bash
################################################################
##
## pconfDump.sh
##
## This script runs pconf to get a list of currently running
## compose stacks, then calls it again for each stack and dumps
## all the data, with some manipulation, into a valid JSON object.
##
## This JSON object can be consumed by the Services dashboard
## code: EbrcWebsiteCommon/Site/dashboard/view/services.php
##
## A sudo user is required.  This script called by pconfCron.sh
## so the data dump is continually refreshed.
##
################################################################

date=$(date)
echo "{\"lastUpdated\":\"$(date)\",\"stacks\":{"
for stack in `sudo pconf | tail -n +15`; do
  echo "\"$stack\":["
  echo `sudo pconf $stack | sed 's/^}$/},/g'`
  echo "{}],"
done
echo "\"empty\":[]}}"
