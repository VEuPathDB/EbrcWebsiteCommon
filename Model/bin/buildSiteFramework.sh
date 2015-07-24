#!/bin/bash

mywget() {
    if hash wget 2>/dev/null; then
        wget "$1"
    else
        curl -OL "$1"
    fi
}

if [[ $# != 1 ]]; then
  echo "Usage: buildSiteFramework.sh <model>"
  echo "  model: site type (e.g. PlasmoDB)"
  exit 1
fi

model=$1
modelLower=$(echo $model | tr '[:upper:]' '[:lower:]')
echo "Will build $model site at /$modelLower"

# record that the current directory is EUPATHDB_HOME
eupath_home=$(pwd)
echo "Recorded eupathdb_home as $eupath_home"

# create environment file (must be sourced by your .bashrc)
envFile=$eupath_home/eupath-env.sh
echo "Creating environment file at $envFile"
echo "#!/bin/bash" > $envFile
echo "export GUS_HOME=$eupath_home/gus_home" >> $envFile
echo "export PROJECT_HOME=$eupath_home/project_home" >> $envFile
echo "export PATH=\$GUS_HOME/bin:\$PROJECT_HOME/install/bin:\$PATH" >> $envFile
source $envFile

# make gus_home required dirs
echo "Creating gus_home"
mkdir -p gus_home/config/$model
mkdir -p gus_home/bin
mkdir -p gus_home/lib/perl/FgpUtil/Util
echo "perl=/usr/bin/perl" > gus_home/config/gus.config

# make basic site structure and create default config files
echo "Creating site structure"
mkdir -p site/etc

# context file will be copied to Tomcat context
echo "Creating webapp context file"
contextFile=$eupath_home/site/etc/$modelLower.xml
echo "<Context" > $contextFile
echo "  docBase=\"$eupath_home/site/webapp\"" >> $contextFile
echo "  privileged=\"false\"" >> $contextFile
echo "  swallowOutput=\"true\"" >> $contextFile
echo "  allowLinking=\"true\">" >> $contextFile
echo "  <Parameter name=\"model\" value=\"$model\"/>" >> $contextFile
echo "</Context>" >> $contextFile

echo "Downloading meta yaml sample and populating known values"
mywget https://www.cbil.upenn.edu/svn/apidb/EuPathSiteCommon/trunk/Model/lib/yaml/metaConfig.yaml.sample
sed "s/PlasmoDB/$model/g" metaConfig.yaml.sample | sed "s/hostdb.org\/hostdb/localhost:8080\/$modelLower/g" > site/etc/metaConfig.yaml
rm metaConfig.yaml.sample

echo "Creating webapp.prop"
webpropFile=$eupath_home/site/etc/webapp.prop
echo "webappTargetDir=$eupath_home/site/webapp" > $webpropFile
echo "htdocsTargetDir=$eupath_home/site/html" >> $webpropFile
echo "cgibinTargetDir=$eupath_home/site/cgi-bin" >> $webpropFile
echo "cgilibTargetDir=$eupath_home/site/cgi-lib" >> $webpropFile
echo "confTargetDir=$eupath_home/site/conf" >> $webpropFile
echo "rProgram=/usr/bin/R" >> $webpropFile

echo "Creating project_home"
mkdir -p project_home
cd project_home

# download files needed to download projects and configure build
mywget https://www.cbil.upenn.edu/svn/gus/FgpUtil/trunk/Util/lib/perl/ProjectBrancher.pm
mv ProjectBrancher.pm $GUS_HOME/lib/perl/FgpUtil/Util
mywget https://www.cbil.upenn.edu/svn/gus/FgpUtil/trunk/Util/bin/fgpCheckout
chmod 755 fgpCheckout
mv fgpCheckout $GUS_HOME/bin
mywget https://www.cbil.upenn.edu/svn/gus/FgpUtil/trunk/Util/bin/generateFilesFromTemplates
chmod 755 generateFilesFromTemplates
mv generateFilesFromTemplates $GUS_HOME/bin
mywget https://www.cbil.upenn.edu/svn/apidb/EuPathSiteCommon/trunk/Model/bin/eupathSiteConfigure
chmod 755 eupathSiteConfigure
mv eupathSiteConfigure $GUS_HOME/bin

