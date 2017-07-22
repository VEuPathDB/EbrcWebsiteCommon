package EbrcWebsiteCommon::View::GraphPackage::SimilarityPlot;

use strict;
use vars qw( @ISA );

@ISA = qw( EbrcWebsiteCommon::View::GraphPackage::GGLinePlot );
use EbrcWebsiteCommon::View::GraphPackage::GGLinePlot;

#----------------------------------------------------------------------------------------------
# Overrides from PlotPart:  Always require 2 profileSets the second uses the secondary ID
#----------------------------------------------------------------------------------------------
sub makeFilesForR {
  my ($self) = @_;

  my $part = $self->getPartName();
  my $profileSampleLabels = $self->getSampleLabels();

  my $profileSets = $self->getProfileSets();

  my $id = $self->getId();
  my $secId = $self->getSecondaryId();

  unless(scalar @$profileSets == 2) {
    die "SimilarityPlot Only works for 2 Profiles";
  }

  unless($secId) {
    die "SimilarityPlot Requires a SecondaryId";
  }

  my $qh = $self->getQueryHandle();
  $profileSets->[0]->writeFiles($id, $qh, $part.0);
  $profileSets->[1]->writeFiles($secId, $qh, $part.1);

  return $self->profileFilesAsRVectors($profileSets);
}


#--------------------------------------------------------------------------------

package EbrcWebsiteCommon::View::GraphPackage::SimilarityPlot::LogRatio;
use base qw( EbrcWebsiteCommon::View::GraphPackage::SimilarityPlot );
use strict;

sub new {
  my $class = shift;
  my $self = $class->SUPER::new(@_);
  my $id = $self->getId();
  my $secId = $self->getSecondaryId();

   $self->setDefaultYMax(2);
   $self->setDefaultYMin(-2);

   $self->setPartName('exprn_val');
   $self->setYaxisLabel("Expression Values");

   $self->setPlotTitle("log(ratio) - $id vs $secId");

   $self->setMakeYAxisFoldInduction(1);
   $self->setIsLogged(1);

   return $self;
}

1;

#--------------------------------------------------------------------------------

package EbrcWebsiteCommon::View::GraphPackage::SimilarityPlot::RMA;
use base qw( EbrcWebsiteCommon::View::GraphPackage::SimilarityPlot );
use strict;

sub new {
  my $class = shift;
  my $self = $class->SUPER::new(@_);
  my $id = $self->getId();
  my $secId = $self->getSecondaryId();

  my $wantLogged = $self->getWantLogged();

  $self->setYaxisLabel("RMA Value (log2)");
  $self->setPlotTitle("RMA - $id vs. $secId");
  $self->setIsLogged(1);

  # RMAExpress is log2
  if($wantLogged eq '0') {
    $self->setAdjustProfile('lines.df = 2^(lines.df);points.df = 2^(points.df);stderr.df = 2^(stderr.df);');
    $self->setYaxisLabel("RMA Value");
  }

  $self->setDefaultYMax(4);
  $self->setDefaultYMin(0);

  $self->setPartName('rma');

  return $self;
}

1;
