#! @perl@ -w

use strict;

use lib "@targetDir@/lib/perl";

use constant DEBUG => 1;

use EbrcWebsiteCommon::View::CgiApp::DataPlotter;

DEBUG && print STDERR "# $0 --------------------------------------------------------\n";

EbrcWebsiteCommon::View::CgiApp::DataPlotter->new()->go();

