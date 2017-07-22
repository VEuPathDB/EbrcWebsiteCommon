#! @perl@ -w

use strict;

use lib "@targetDir@/lib/perl";
$ENV{GUS_HOME} = '@targetDir@';

die "targetDir macro undefined" if !$ENV{GUS_HOME};

use constant DEBUG => 0;

use EbrcWebsiteCommon::View::CgiApp::GraphViewer;


DEBUG && print STDERR "# $0 --------------------------------------------------------\n";

EbrcWebsiteCommon::View::CgiApp::GraphViewer->new()->go();
