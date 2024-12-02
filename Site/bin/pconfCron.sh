#!/bin/bash
################################################################
##
## pconfCron.sh
##
## Stand-in script for a real cron job to manage dumping pconf
## data into a file where it can be read by Dashboard (see docs
## in pconfDump.sh for details).  This script should be run as:
##
## > export PATH=/var/www/<any_built_site>/gus_home/bin:$PATH
## > nohup pconfCron.sh &> /dev/null &
##
## This will continually update pconfLatest.json with the latest
## information for running services.
##
################################################################

# hard-coded path referenced in the Dashboard code
#  TODO: find a better location
file=/home/rdoherty/pconfLatest.json

# how often pconf is queried to update information (in seconds)
updateFrequency=120

while true; do
  pconfDump.sh > ${file}.generating
  mv ${file}.generating ${file}
  chmod 777 ${file}
  sleep $updateFrequency
done
