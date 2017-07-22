package EbrcWebsiteCommon::View::GraphPackage::SimpleRNASeq;

use strict;

use Data::Dumper;
use vars qw( @ISA );

@ISA = qw( EbrcWebsiteCommon::View::GraphPackage::MixedPlotSet );
use EbrcWebsiteCommon::View::GraphPackage::MixedPlotSet;

use EbrcWebsiteCommon::View::GraphPackage::BarPlot;
use EbrcWebsiteCommon::View::GraphPackage::Util;

sub getMinRpkmProfileSet { $_[0]->{_min_rpkm_profile_set} }
sub setMinRpkmProfileSet { $_[0]->{_min_rpkm_profile_set} = $_[1] }

sub getDiffRpkmProfileSet { $_[0]->{_diff_rpkm_profile_set} }
sub setDiffRpkmProfileSet { $_[0]->{_diff_rpkm_profile_set} = $_[1] }

sub getMinRpkmProfileSetDisplayName { $_[0]->{_min_rpkm_profile_set_display} }
sub setMinRpkmProfileSetDisplayName { $_[0]->{_min_rpkm_profile_set_display} = $_[1] }

sub getDiffRpkmProfileSetDisplayName { $_[0]->{_diff_rpkm_profile_set_display} }
sub setDiffRpkmProfileSetDisplayName { $_[0]->{_diff_rpkm_profile_set_display} = $_[1] }

sub getPctProfileSet { $_[0]->{_pct_profile_set} }
sub setPctProfileSet { $_[0]->{_pct_profile_set} = $_[1] }

sub getAdditionalRCode { $_[0]->{_additional_r_code} }
sub setAdditionalRCode { $_[0]->{_additional_r_code} = $_[1] }

sub getColor { $_[0]->{_color} }
sub setColor { $_[0]->{_color} = $_[1] }

#sub getSampleNames { $_[0]->{_sample_names} }
sub setSampleNames { $_[0]->{_sample_names} = $_[1] }

# Template subclasses should override if we want to change the sample names
sub getSampleLabelsString { $_[0]->{sample_labels_string} }
sub setSampleLabelsString { $_[0]->{sample_labels_string} = $_[1] }

sub getSampleNames {
  my ($self) = @_;

  if($self->{_sample_names}) {
    return $self->{_sample_names};
  } 
  if($self->getSampleLabelsString()) {
    my $sampleLabelsString = $self->getSampleLabelsString();
    my @rv = split(/;/, $sampleLabelsString);
    return \@rv;
  } 
} 

sub getIsPairedEnd { $_[0]->{_is_paired_end} }
sub setIsPairedEnd { $_[0]->{_is_paired_end} = $_[1] }

sub setForceXLabelsHorizontalString {$_[0]->{_force_x_labels_horizontal} = $_[1]}
sub getForceXLabelsHorizontalString {$_[0]->{_force_x_labels_horizontal}}


sub setBottomMarginSize {
  my ($self, $ms) = @_;

  return unless $ms;

  # set the margin size for the mixed plot
  $self->SUPER::setBottomMarginSize($ms);


  # set the margin size for each of the parts if already set
  my $graphObjects = $self->getGraphObjects();
  foreach(@{$graphObjects}) {
    $_->setElementNameMarginSize($ms);
  }

}


sub getPlotType {
  my $self = shift;

  my $isPairedEnd = $self->getIsPairedEnd();

  my $stacked;

  if($isPairedEnd){
    $stacked = EbrcWebsiteCommon::View::GraphPackage::BarPlot::PairedEndRNASeqStacked->new(@_);
  }
  else {
    $stacked  = EbrcWebsiteCommon::View::GraphPackage::BarPlot::RNASeqStacked->new(@_);
  }

  return $stacked;
}



sub makeGraphs {
  my $self = shift;

  my $minRpkmProfileSet = $self->getMinRpkmProfileSet();
  my $diffRpkmProfileSet = $self->getDiffRpkmProfileSet();

  my ($minSuffix) = $minRpkmProfileSet =~ /(\s-\s.+)$/; 
  my ($diffSuffix) = $diffRpkmProfileSet =~ /(\s-\s.+)\s-\sdiff$/; 

  my $minRpkmProfileSetDisplay = $self->getMinRpkmProfileSetDisplayName() ? $self->getMinRpkmProfileSetDisplayName() : "Unique";
  my $diffRpkmProfileSetDisplay = $self->getDiffRpkmProfileSetDisplayName() ? $self->getDiffRpkmProfileSetDisplayName() : "Non Unique";

  $minRpkmProfileSetDisplay .= $minSuffix if($minSuffix);
  $diffRpkmProfileSetDisplay .= $diffSuffix if($diffSuffix);

  my $pctProfileSet = $self->getPctProfileSet();
  my $additionalRCode = $self->getAdditionalRCode();
  my $forceXLabelsHorizontal = $self->getForceXLabelsHorizontalString ? 1 : 0;

  my $color = $self->getColor() ? $self->getColor() : 'blue';
  my $isPairedEnd = $self->getIsPairedEnd();

  my $sampleNames = $self->getSampleNames();

  my @colors = ($color, '#DDDDDD');
  my @legend = ("Uniquely Mapped", "Non-Uniquely Mapped");

  $self->setMainLegend({colors => \@colors, short_names => \@legend, cols => 2});

  my @profileArray = ([$minRpkmProfileSet, '', $sampleNames, '', '', '', $minRpkmProfileSetDisplay],
                      [$diffRpkmProfileSet, '', $sampleNames, '', '', '', $diffRpkmProfileSetDisplay],
                     );


  my $profileSets = EbrcWebsiteCommon::View::GraphPackage::Util::makeProfileSets(\@profileArray);

  my $percentileSets = EbrcWebsiteCommon::View::GraphPackage::Util::makeProfileSets([[$pctProfileSet, '', $sampleNames]]);

  my $stacked = $self->getPlotType(@_);
 
  $stacked->setProfileSets($profileSets);
  $stacked->setColors(\@colors);
  $stacked->addAdjustProfile($additionalRCode);
  $stacked->setForceHorizontalXAxis($forceXLabelsHorizontal);


  my $percentile = EbrcWebsiteCommon::View::GraphPackage::BarPlot::Percentile->new(@_);
  $percentile->setProfileSets($percentileSets);
  $percentile->setColors([$colors[0]]);
  $percentile->addAdjustProfile($additionalRCode);
  $percentile->setForceHorizontalXAxis($forceXLabelsHorizontal);

  if(my $bottomMargin = $self->getBottomMarginSize()) {
    $stacked->setElementNameMarginSize($bottomMargin);
    $percentile->setElementNameMarginSize($bottomMargin);
  }


  $self->setGraphObjects($stacked, $percentile);

  return $self;
}


1;
