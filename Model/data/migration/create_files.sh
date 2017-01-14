#!/bin/bash

mkdir -p gus_home/config project_home yaml control
export GUS_HOME=$(pwd)/gus_home
export PROJECT_HOME=$(pwd)/project_home
echo "perl=/usr/bin/perl" > $GUS_HOME/config/gus.config
cd $PROJECT_HOME
svn co https://www.cbil.upenn.edu/svn/gus/install/trunk install
svn co https://www.cbil.upenn.edu/svn/gus/FgpUtil/trunk FgpUtil
cd ..
source $PROJECT_HOME/install/bin/gusEnv.bash
bld FgpUtil
cd $PROJECT_HOME
rm -rf FgpUtil install
fgpCheckout allsite trunk
cd ..
bld EuPathPresenters
bld OrthoMCLWebsite
cp $PROJECT_HOME/EuPathSiteCommon/Model/lib/yaml/metaConfig.yaml.sample yaml/PlasmoDBMetaConfig.yaml
