#!/bin/bash
################################################################################
##
## USAGE: runTestsOnAllSites.sh <site_prefix> <output_dir>
##
## Runs testRunner.sh on all Api component websites of a certain class
## (integrate, beta, QA, live) and puts the output in a collection of
## directories under the specified output_dir.  site_prefix should be the
## non-proxied subdomain, e.g.   'for north QA (on pine).
##
################################################################################

sites=(\
  'amoebadb.org'\
  'cryptodb.org'\
  'fungidb.org'\
  'giardiadb.org'\
  'hostdb.org'\
  'microsporidiadb.org'\
  'piroplasmadb.org'\
  'plasmodb.org'\
  'toxodb.org'\
  'trichdb.org'\
  'tritrypdb.org'\
  'vectorbase.org'\
  'eupathdb.org'\
  'veupathdb.org'\
)

function runTestsOnSite {
  local domain=$1
  local siteDir=/var/www/$domain
  if [ ! -e $siteDir ]; then
    echo "Skipping $domain. $siteDir does not exist"
    return
  fi
  cd /var/www/$domain
  source etc/setenv
  local projectId=$WDK_MODEL # environment var set by setenv
  local outputDir=$2/$projectId
  local siteUrl=https://$domain
  # USAGE: testRunner.sh <project_id> <site_url> <output_dir> [<working_dir>]
  cmd="testRunner.sh $projectId $siteUrl $outputDir/results $outputDir/work"
  echo "$cmd"
  $cmd
}

if [ ! $# -eq 2 ]; then
  echo "USAGE: runTestsOnAllSites.sh <site_prefix> <outputDir>"
  exit 1
fi

outputDir=$(realpath $2)
if [ ! -e $outputDir ]; then
  echo "Specified output directory '$outputDir' does not exist"
  exit 2
fi

echo "Running tests on ${#sites[@]} sites"
for site in "${sites[@]}"; do
  domain="$1.$site"
  runTestsOnSite $domain $outputDir
done
