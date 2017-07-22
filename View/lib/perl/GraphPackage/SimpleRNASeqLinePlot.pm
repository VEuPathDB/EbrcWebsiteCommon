package EbrcWebsiteCommon::View::GraphPackage::SimpleRNASeqLinePlot;

use strict;
use vars qw( @ISA );

@ISA = qw( EbrcWebsiteCommon::View::GraphPackage::SimpleRNASeq );
use EbrcWebsiteCommon::View::GraphPackage::SimpleRNASeq;

use EbrcWebsiteCommon::View::GraphPackage::LinePlot;
use EbrcWebsiteCommon::View::GraphPackage::Util;


sub getXAxisLabel { $_[0]->{_x_axis_label} }
sub setXAxisLabel { $_[0]->{_x_axis_label} = $_[1] }

sub getIsPairedEnd { $_[0]->{_is_paired_end} }
sub setIsPairedEnd { $_[0]->{_is_paired_end} = $_[1] }

sub makeGraphs {
  my $self = shift;

  my $minRpkmProfileSet = $self->getMinRpkmProfileSet();
  my $diffRpkmProfileSet = $self->getDiffRpkmProfileSet();
  my $pctProfileSet = $self->getPctProfileSet();
  my $additionalRCode = $self->getAdditionalRCode();
  my $color = $self->getColor() ? $self->getColor() : 'blue';
  my $isPairedEnd = $self->getIsPairedEnd();

  my $sampleNames = $self->getSampleNames();

  my @colors = ('#DDDDDD', $color);
  my @legend = ("Non-Uniquely Mapped", "Uniquely Mapped");

  $self->setMainLegend({colors => \@colors, short_names => \@legend, cols => 2});

  # Draw the diff first in light grey ... then the min rpkm will go on top
  my @profileArray = ([$diffRpkmProfileSet, '', $sampleNames],
                      [$minRpkmProfileSet, '', $sampleNames],
                     );

  my $profileSets = EbrcWebsiteCommon::View::GraphPackage::Util::makeProfileSets(\@profileArray);
  my $percentileSets = EbrcWebsiteCommon::View::GraphPackage::Util::makeProfileSets([[$pctProfileSet, '', $sampleNames]]);

  my $stacked;

  if($isPairedEnd){
    $stacked = EbrcWebsiteCommon::View::GraphPackage::LinePlot::PairedEndRNASeq->new(@_);
  }
  else {
    $stacked  = EbrcWebsiteCommon::View::GraphPackage::LinePlot::RNASeq->new(@_)
  }

  $additionalRCode = "lines.df[1,] = lines.df[1,] + lines.df[2,];\n$additionalRCode";

  $stacked->setProfileSets($profileSets);
  $stacked->setColors(\@colors);
  $stacked->setIsPairedEnd($isPairedEnd);
  $stacked->addAdjustProfile($additionalRCode);
  $stacked->setXaxisLabel($self->getXAxisLabel());

  my $percentile = EbrcWebsiteCommon::View::GraphPackage::BarPlot::Percentile->new(@_);
  $percentile->setProfileSets($percentileSets);
  $percentile->setColors([$colors[1]]);
  $percentile->addAdjustProfile($additionalRCode);

  if(my $bottomMargin = $self->getBottomMarginSize()) {
    $stacked->setElementNameMarginSize($bottomMargin);
    $percentile->setElementNameMarginSize($bottomMargin);
  }


  $self->setGraphObjects($stacked, $percentile);

  return $self;
}

