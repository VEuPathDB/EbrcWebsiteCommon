#!/bin/bash

set -e # exit on error

if [ "$#" != "1" ]; then
  echo 'USAGE: build_framework.sh ["trunk"|<svn_branch>]'
  exit 1
fi

branch=$1
branchPath=$branch
if [ "$branch" != "trunk" ]; then
  branchPath=branches/$branch
fi

set -x # echo commands as they run

mkdir -p gus_home/config project_home yaml control
export GUS_HOME=$(pwd)/gus_home
export PROJECT_HOME=$(pwd)/project_home
echo "perl=/usr/bin/perl" > $GUS_HOME/config/gus.config
cd $PROJECT_HOME
svn co https://www.cbil.upenn.edu/svn/gus/install/$branchPath install
svn co https://www.cbil.upenn.edu/svn/gus/FgpUtil/$branchPath FgpUtil
cd ..
source $PROJECT_HOME/install/bin/gusEnv.bash
bld FgpUtil
cd $PROJECT_HOME
rm -rf FgpUtil install
fgpCheckout allsite $branch
cd ..
bld EuPathPresenters
bld OrthoMCLWebsite
cp $PROJECT_HOME/EuPathSiteCommon/Model/lib/yaml/metaConfig.yaml.sample yaml/PlasmoDBMetaConfig.yaml
