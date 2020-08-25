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
    mkdir -p $5
    if [ ! -e $5 ]; then
      echo "$1 $5 must be an existing directory; cannot create"
      exit 3
    fi
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

  outputDir=$(realpath $outputDir)
  if [ "$workingDir" = "" ]; then
    workingDir="$(pwd)"
  else
    workingDir=$(realpath $workingDir)
  fi

  # clean entire output dir; can assume its sole purpose is to hold test results
  rm -rf $outputDir/*
  rm -rf $workingDir/wdk-api-test
  rm -rf $workingDir/target

  # run Java unit tests on FgpUtil
  echo "Building FgpUtil Test project..."
  cd $projectHome/FgpUtil/Test
  mvn -Dalt.build.dir=$workingDir/target install
  echo "Running Java unit tests..."
  cd ..
  mvn -Dalt.build.dir=$workingDir/target test 2>&1 | tee $outputDir/java-unit-tests.out

  # run JavaScript unit tests on WDKClient
  echo "Running JavaScript unit tests..."
  cd $projectHome/WDKClient/Client
  yarn test 2>&1 | tee $outputDir/javascript-unit-tests.out

  # run service API tests
  echo "Downloading API test framework"
  cd $workingDir
  git clone https://github.com/VEuPathDB/wdk-api-test.git
  cd wdk-api-test
  apiTestCmd="./run -c $siteUrl/a"
  echo "Running API tests with command: $apiTestCmd"
  $apiTestCmd 2>&1 | tee $outputDir/service-api-tests.out

  # run smoke/selenium tests
  echo "Running Smoke/Selenium tests..."
  # TODO: add run of smoke/selenium tests; need to figure out how

  echo "Testing complete."
}

if [ ! $# -eq 3 ] && [ ! $# -eq 4 ]; then
  echo "USAGE: testRunner.sh <project_id> <site_url> <output_dir> [<working_dir>]"
  exit 1
fi

runTests $@
