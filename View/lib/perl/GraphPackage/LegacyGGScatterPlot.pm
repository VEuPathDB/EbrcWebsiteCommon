package EbrcWebsiteCommon::View::GraphPackage::LegacyGGScatterPlot;

use strict;
use vars qw( @ISA );

@ISA = qw( EbrcWebsiteCommon::View::GraphPackage::LegacyGGLinePlot );
use EbrcWebsiteCommon::View::GraphPackage::LegacyGGLinePlot;

sub new {
  my $class = shift;
  my $self = $class->SUPER::new(@_);

  $self->setPartName('xy_scatter');
  $self->setYaxisLabel("Expression Values");

  $self->setForceNoLines(1);
  $self->setVaryGlyphByXAxis(1);

   $self->setXaxisLabel("");
  return $self;
}

package EbrcWebsiteCommon::View::GraphPackage::LegacyGGScatterPlot::LogRatio;
use base qw( EbrcWebsiteCommon::View::GraphPackage::LegacyGGScatterPlot );
use strict;

sub new {
  my $class = shift;
  my $self = $class->SUPER::new(@_);
  my $id = $self->getId();

  $self->setPlotTitle("Expression Values - log(ratio) - $id");

  $self->setMakeYAxisFoldInduction(1);
  $self->setIsLogged(1);

   return $self;
}

1;

package EbrcWebsiteCommon::View::GraphPackage::LegacyGGScatterPlot::ClinicalMetaData;
use base qw( EbrcWebsiteCommon::View::GraphPackage::LegacyGGScatterPlot );
use strict;

sub new {
  my $class = shift;
  my $self = $class->SUPER::new(@_);
  my $id = $self->getId();
  my $metaDataCategory = $self->getTypeArg;

  $self->setPlotTitle("Signal Intensity Values - arcsinh(1+50*value) - $id");

  $self->setMakeYAxisFoldInduction(0);
  $self->setIsLogged(0);
  $self->setYaxisLabel('Signal Intensity');
  $self->setHasExtraLegend(1);
  $self->setExtraLegendSize(4.5);
  $self->setHasMetaData(1);
  $self->setDefaultYMax(1);
  $self->setDefaultYMin(-1);
  $self->setElementNameMarginSize(4);
  $self->setXaxisLabel("Samples colored based on $metaDataCategory");
   return $self;
}

1;



1;

