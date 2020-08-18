#!/bin/bash
################################################################################
##
## USAGE: testRunner.sh <project_id> <site_url> <output_dir> [<working_dir>]
##
## If working_dir omitted $(pwd) will be used.
##
## Depends on environment variables $GUS_HOME and $PROJECT_HOME
##
################################################################################

function checkInputVar {
  if [ "$3" = "required" ] && [ "$5" = "" ]; then
    echo "Required $2: $1"
    exit 2
  elif [ "$4" = "dir" ] && [ ! -e $5 ]; then
    echo "$1 $5 must be an existing directory"
    exit 3
  fi
}

function runTests {

  projectId="$1"
  siteUrl="$2"
  outputDir="$3"
  workingDir="$4"
  gusHome="$GUS_HOME"
  projectHome="$PROJECT_HOME"
  
  checkInputVar "project_id"   "argument" "required" ""    $projectId
  checkInputVar "site_url"     "argument" "required" ""    $siteUrl
  checkInputVar "output_dir"   "argument" "required" "dir" $outputDir
  checkInputVar "working_dir"  "argument" "optional" "dir" $workingDir
  checkInputVar "GUS_HOME"     "env var"  "required" "dir" $gusHome
  checkInputVar "PROJECT_HOME" "env var"  "required" "dir" $projectHome
  
  if [ "$workingDir" = "" ]; then
    workingDir="$(pwd)"
  fi

  # run Java unit tests on FgpUtil
  cd $projectHome/FgpUtil; mvn test >& $outputDir/java-unit-tests.out
  cat $outputDir/java-unit-tests.out

  # run JavaScript unit tests on WDKClient
  cd $projectHome/WDKClient/Client; yarn test >& $outputDir/javascript-unit-tests.out
  cat $outputDir/javascript-unit-tests.out

  # run service API tests
  cd $workingDir
  git clone https://github.com/VEuPathDB/wdk-api-test.git
  cd wdk-api-test
  ./run -c -u $siteUrl/a/service >& $outputDir/wdk-api-tests.out
  cat $outputDir/wdk-api-tests.out

  # run selenium tests
  cd $projectHome
  build EbrcWebsiteCommon/Watar-Installation install -append
  # TODO: add run of selenium tests; John B will tell me how

}

if [ ! $# -eq 3 ] && [ ! $# -eq 4 ]; then
  echo "USAGE: testRunner.sh <project_id> <site_url> <output_dir> [<working_dir>]"
  exit 1
fi

runTests $@
