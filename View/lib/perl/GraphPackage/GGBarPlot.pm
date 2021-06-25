package EbrcWebsiteCommon::View::GraphPackage::GGBarPlot;

use strict;
use vars qw( @ISA );
use Data::Dumper;

@ISA = qw( EbrcWebsiteCommon::View::GraphPackage::PlotPart );
use EbrcWebsiteCommon::View::GraphPackage::PlotPart;
use EbrcWebsiteCommon::View::GraphPackage::Util;
use EbrcWebsiteCommon::View::GraphPackage;

use LWP::UserAgent;

#--------------------------------------------------------------------------------

sub getIsStacked                 { $_[0]->{'_stack_bars'                     }}
sub setIsStacked                 { $_[0]->{'_stack_bars'                     } = $_[1]}

sub getForceHorizontalXAxis      { $_[0]->{'_force_x_horizontal'             }}
sub setForceHorizontalXAxis      { $_[0]->{'_force_x_horizontal'             } = $_[1]}

sub getIsHorizontal              { $_[0]->{'_is_horizontal'                  }}
sub setIsHorizontal              { $_[0]->{'_is_horizontal'                  } = $_[1]}

sub getSpaceBetweenBars          { $_[0]->{'_space_between_bars'             }}
sub setSpaceBetweenBars          { $_[0]->{'_space_between_bars'             } = $_[1]}

sub getAxisPadding          { $_[0]->{'_axis_padding'             }}
sub setAxisPadding          { $_[0]->{'_axis_padding'             } = $_[1]}

sub getAxisLty                  { $_[0]->{'_axis_lty'                        }}
sub setAxisLty                  { $_[0]->{'_axis_lty'                        } = $_[1]}

sub getLas                      { $_[0]->{'_las'                             }}
sub setLas                      { $_[0]->{'_las'                             } = $_[1]}

sub getSkipStdErr                 { $_[0]->{'_skip_std_err'                      }}
sub setSkipStdErr                 { $_[0]->{'_skip_std_err'                      } = $_[1]}

sub getColorVals                 { $_[0]->{'_color_vals'                    }}
sub setColorVals                 { $_[0]->{'_color_vals'                    } = $_[1]}

sub getCustomBreaks              { $_[0]->{'_custom_breaks'                 }}
sub setCustomBreaks              { $_[0]->{'_custom_breaks'                 } = $_[1]}

sub getFacetNumCols              { $_[0]->{'_facet_num_cols'                }}
sub setFacetNumCols              { $_[0]->{'_facet_num_cols'                } = $_[1]}

sub getStrandDictionaryHash      { $_[0]->{'_strand_dictionary_hash'        }}

sub blankPlotPart {
  my ($self) = @_;
  $self->blankGGPlotPart(@_);
}

#--------------------------------------------------------------------------------

sub new {
  my ($class,$args,$profileSets) = @_;

  my $self = $class->SUPER::new($args,$profileSets);

  $self->setSpaceBetweenBars(0.3);
  $self->setAxisPadding(1.1);
  $self->setSkipStdErr(0);
   return $self;
}

#--------------------------------------------------------------------------------
sub makeRPlotString {
  my ($self, $idType) = @_;

  my $sampleLabels = $self->getSampleLabels();
  my $sampleLabelsString = EbrcWebsiteCommon::View::GraphPackage::Util::rStringVectorFromArray($sampleLabels, 'x.axis.label');
  my $overrideXAxisLabels = scalar @$sampleLabels > 0 ? "TRUE" : "FALSE";
  my $skipStdErr = $self->getSkipStdErr() ? 'TRUE' : 'FALSE';

  my $isSVG = lc($self->getFormat()) eq 'svg' ? 'TRUE' : 'FALSE'; 

  my $blankGraph = $self->blankGGPlotPart();

  my $profileSetsRequest = $self->makePlotDataRequestForR($idType);
  my $plotDataJson;
  my $ua = LWP::UserAgent->new;
  push @{ $ua->requests_redirectable }, 'POST';
  my $resp = $ua->request($profileSetsRequest);
  if ($resp->is_success) {
    $plotDataJson = $resp->decoded_content;
    $plotDataJson =~ s/\'/\\\'/g;
  } else {
    print "HTTP POST error code: ", $resp->code, "\n";
    print "HTTP POST error message: ", $resp->message, "\n";
    return $blankGraph
  }

  my $colors = $self->getColors();

  my $colorsString = EbrcWebsiteCommon::View::GraphPackage::Util::rStringVectorFromArray($colors, 'the.colors');

  my $forceAutoColors = defined($self->forceAutoColors()) ? 'TRUE' : 'FALSE';

  my $rAdjustProfile = $self->getAdjustProfile();
  my $yAxisLabel = $self->getYaxisLabel();
  my $plotTitle = $self->getPlotTitle();

  my $yMax = $self->getDefaultYMax();
  my $yMin = $self->getDefaultYMin();

  my $out_f = $self->getOutputFile();

  my $isThumbnail = "FALSE";

  if($self->getThumbnail()) {
    $isThumbnail = "TRUE";
  }

  my $isCompactString = "FALSE";

  if($self->isCompact()) {
    $isCompactString = "TRUE";
  }

  my $isStack = $self->getIsStacked() ? 'TRUE' : 'FALSE';
  my $isHorizontal = $self->getIsHorizontal();

  my $horizontalXAxisLabels = $self->getForceHorizontalXAxis();

  $rAdjustProfile = $rAdjustProfile ? $rAdjustProfile : "";
  my $rPostscript = $self->getRPostscript();
  $rPostscript = $rPostscript ? $rPostscript : "";

  $horizontalXAxisLabels = $horizontalXAxisLabels ? 'TRUE' : 'FALSE';

  my $horiz = $isHorizontal && !$self->isCompact() ? 'TRUE' : 'FALSE';

  my $hideXAxisLabels = $self->getHideXAxisLabels() ? 'TRUE' : 'FALSE';

  my $titleLine = $self->getTitleLine();

  my $bottomMargin = $self->getElementNameMarginSize();
  my $spaceBetweenBars = $self->getSpaceBetweenBars();

  my $scale = $self->getScalingFactor;

  my $hasExtraLegend = $self->getHasExtraLegend() ? 'TRUE' : 'FALSE';
  my $legendLabels = $self->getLegendLabels();

  my ($legendLabelsString, $legendColors, $legendColorsString);

  my $facets = $self->getFacets();
  my $facetString = ". ~ DUMMY";
  my $hasFacets = "FALSE";

  if ($facets && scalar @$facets != 0) {
    if(scalar @$facets == 1 && $facets->[0] ne 'none' && $facets->[0] ne 'na') {
      $facetString = ". ~ " . $facets->[0];
      $hasFacets = "TRUE";
    }elsif(scalar @$facets == 2) {
      if($facets->[1] ne 'none' && $facets->[0] ne 'none') {
        $facetString = $facets->[0] . " ~  " . $facets->[1];
        $hasFacets = "TRUE";
      }elsif($facets->[0] eq 'none' && $facets->[1] ne 'none') {
        $facetString = ". ~ " . $facets->[1];
        $hasFacets = "TRUE";
      }elsif($facets->[0] ne 'none' && $facets->[1] eq 'none') {
        $facetString = ". ~ " . $facets->[0];
        $hasFacets = "TRUE";
      }
    }
  }

  my $colorVals = $self->getColorVals();
  $colorVals = $colorVals ? $colorVals : '';
  my $hasColorVals = $colorVals ? 'TRUE' : 'FALSE';

  if ($hasExtraLegend ) {
      $legendLabelsString = EbrcWebsiteCommon::View::GraphPackage::Util::rStringVectorFromArray($legendLabels, 'legend.label');

      $legendColors = $self->getLegendColors();
      $legendColors = $colors if !($legendColors);
      $legendColorsString = EbrcWebsiteCommon::View::GraphPackage::Util::rStringVectorFromArray($legendColors, 'legend.colors');
    }

  my $hasLegendLabels = $legendLabelsString ? 'TRUE' : 'FALSE';

  my $extraLegendSize = $self->getExtraLegendSize();

  my $axisPadding = $self->getAxisPadding();

  my $rv = "
# ---------------------------- BAR PLOT ----------------------------

$colorsString
$sampleLabelsString
$legendLabelsString
$legendColorsString

is.compact=$isCompactString;
is.thumbnail=$isThumbnail;

#-------------------------------------------------------------------

y.min = $yMin;
y.max = $yMax;

profile.df.full = fromJSON('$plotDataJson');

if(class(profile.df.full) == 'list'){

  d = data.frame(VALUE=0.5, LABEL=\"None\");
  gp = ggplot() + geom_blank() + geom_text(data=d, mapping=aes(x=VALUE, y=VALUE, label=LABEL), size=10) + theme_void() + theme(legend.position=\"none\");

} else {

  if (\"standard_error\" %in% profile.df.full\$PROFILE_TYPE) {
    if ($skipStdErr) {
      profile.df.full <- profile.df.full[profile.df.full\$PROFILE_TYPE != 'standard_error',]
      profile.df.full\$STDERR <- NA
    } else {
      profile.values <- profile.df.full[profile.df.full\$PROFILE_TYPE != 'standard_error',]
      profile.stderr <- profile.df.full[profile.df.full\$PROFILE_TYPE == 'standard_error',]
      profile.stderr\$PROFILE_TYPE <- NULL
      profile.stderr\$PROFILE_ORDER <- NULL
      names(profile.stderr)[names(profile.stderr) == 'VALUE'] <- 'STDERR'
      profile.df.full <- merge(profile.values, profile.stderr, by = c('PROFILE_SET_NAME', 'NAME', 'ELEMENT_ORDER'), all.x = TRUE)
      profile.df.full <- profile.df.full[order(profile.df.full\$PROFILE_ORDER, profile.df.full\$ELEMENT_ORDER),]
      profile.df.full\$STDERR <- as.numeric(profile.df.full\$STDERR)
    }
  } else {
    profile.df.full\$STDERR <- NA
  }
  
  profile.df.full\$NAME <- factor(profile.df.full\$NAME, levels=unique(profile.df.full\$NAME))
  profile.df.full\$VALUE <- as.numeric(profile.df.full\$VALUE)
  if (!\"PROFILE_SET\" %in% names(profile.df.full)) {
    profile.df.full\$PROFILE_SET <- paste(profile.df.full\$PROFILE_SET_NAME, '-', profile.df.full\$PROFILE_TYPE)
  }
  profile.df.full\$PROFILE_SET_NAME <- NULL
  
  if (!is.null(legend.label)) {
    if (uniqueN(profile.df.full\$PROFILE_SET) > 1) {
      profile.df.full\$LEGEND <- factor(profile.df.full\$PROFILE_SET, levels=unique(profile.df.full\$PROFILE_SET), labels=legend.label)
    } else if (nrow(profile.df.full) == length(legend.label)) {
      profile.df.full\$LEGEND <- factor(legend.label)
    } else {
      warning(\"legend.label provided, but unused.\")
    }
  }
  
  if($overrideXAxisLabels && !is.null(x.axis.label)) {
    profile.df.full\$NAME <- factor(profile.df.full\$NAME, levels=unique(profile.df.full\$NAME), labels=x.axis.label)
  }

  profile.df.full\$MIN_ERR = profile.df.full\$VALUE - profile.df.full\$STDERR;
  profile.df.full\$MAX_ERR = profile.df.full\$VALUE + profile.df.full\$STDERR;
  
  expandColors = FALSE;
  hideLegend = FALSE;
  
  numElements <- uniqueN(profile.df.full\$NAME)
  if (force(numElements) > length(force(the.colors))) {
    expandColors=TRUE;
  }
  
  if(is.null(profile.df.full\$LEGEND)) {
    profile.df.full\$LEGEND = as.factor(profile.df.full\$NAME)
    hideLegend = TRUE;
  } else {
    profile.df.full\$LEGEND = as.factor(profile.df.full\$LEGEND);
  }
  
  if ($hasColorVals) {
    hideLegend = FALSE
  }
  
  if ($isStack) {
      profile.df.full\$STACK = profile.df.full\$LEGEND;
  }
  
  # allow minor adjustments to profile
  $rAdjustProfile
  
  if ($isStack) {
    temp.df = aggregate(VALUE ~ NAME, profile.df.full, sum)
    y.max = max(y.max, temp.df\$VALUE);
    y.max = max(y.max, profile.df.full\$MAX_ERR, na.rm = TRUE);
    y.min = min(y.min, temp.df\$VALUE);
    y.min = min(y.min, profile.df.full\$MAX_ERR, na.rm = TRUE);
  } else {
    y.max = max(c(y.max, profile.df.full\$VALUE, profile.df.full\$MAX_ERR), na.rm=TRUE);
    y.min = min(c(y.min, profile.df.full\$VALUE, profile.df.full\$MIN_ERR), na.rm=TRUE);
  }
  
  gp = ggplot(profile.df.full, aes(x=NAME, y=VALUE, fill=LEGEND, colour=LEGEND));
  
  if($isSVG) {
    useTooltips=TRUE;
  }else{
    useTooltips=FALSE;
  }
  
  if(useTooltips) {
     if($isStack) {
       gp = gp + geom_tooltip(aes(tooltip=STACK), real.geom=geom_bar, position=\"stack\", colour=\"black\");
     } else {
       gp = gp + geom_tooltip(aes(tooltip=NAME), real.geom=geom_bar, position=\"dodge\");
     } 
  } else {
     if($isStack) {
       gp = gp + geom_bar(stat=\"identity\", position=\"stack\", colour=\"black\");
     } else {
       gp = gp + geom_bar(stat=\"identity\", position=\"dodge\");
     }
  }
  
  if($hasColorVals) {
    gp = gp + scale_fill_manual(values = $colorVals, breaks = names($colorVals), name=NULL)
    gp = gp + scale_color_manual(values = $colorVals, breaks = names($colorVals), name=NULL)
  } else if (expandColors) {
   #!!!!!!!!!!!!!!!!! i believe the below will only work when length(NAME)/length(colorstring) divides evenly
    gp = gp + scale_fill_manual(values=rep(force(the.colors), force(numElements)/length(force(the.colors))), breaks=levels(profile.df.full\$LEGEND), name=NULL);
    gp = gp + scale_colour_manual(values=rep(force(the.colors), force(numElements)/length(force(the.colors))), breaks=levels(profile.df.full\$LEGEND), name=NULL);
  } else {
    if($forceAutoColors) {
  #    numColors = length(levels(as.factor(profile.df.full\$LEGEND)));
  #    gp = gp + scale_fill_manual(values=viridis(numColors), breaks=profile.df.full\$LEGEND, name=NULL);  
  #    gp = gp + scale_colour_manual(values=viridis(numColors), breaks=profile.df.full\$LEGEND, name=NULL);
  
       gp = gp + scale_fill_brewer(palette=\"Set1\");
       gp = gp + scale_colour_brewer(palette=\"Set1\");
    }
    else {
      gp = gp + scale_fill_manual(values=force(the.colors), breaks=levels(profile.df.full\$LEGEND), name=NULL);  
      gp = gp + scale_colour_manual(values=force(the.colors), breaks=levels(profile.df.full\$LEGEND), name=NULL);
    }
  }
  
  if($isStack) {
      gp = gp + geom_errorbar(aes(ymin=MIN_ERR, ymax=MAX_ERR), colour=\"black\", width=.1);
  } else {
      gp = gp + geom_errorbar(aes(ymin=MIN_ERR, ymax=MAX_ERR), colour=\"black\", width=.1,position = position_dodge(.9));
  }
  
  
  barCount = length(profile.df.full\$NAME);
  
  if(is.compact) {
    gp = gp + theme_void() + theme(legend.position=\"none\");
  } else if(is.thumbnail) {
    gp = gp + theme_bw();
    gp = gp + labs(title=\"$plotTitle\", y=\"$yAxisLabel\", x=NULL);
    gp = gp + ylim(y.min, y.max);
    gp = gp + scale_x_discrete(label=function(x) customAbbreviate(x));
  
    if(barCount < 3) {
      gp = gp + theme(axis.text.x  = element_text(size=9), plot.title = element_text(colour=\"#b30000\"), panel.grid.major.x = element_blank());
    }
    else {
      gp = gp + theme(axis.text.x  = element_text(angle=45,vjust=1, hjust=1, size=9), plot.title = element_text(colour=\"#b30000\"), panel.grid.major.x = element_blank());
    }
    gp = gp + theme(legend.position=\"none\");
  } else {
    gp = gp + theme_bw();
    gp = gp + labs(title=\"$plotTitle\", y=\"$yAxisLabel\", x=NULL);
    gp = gp + ylim(y.min, y.max);
    gp = gp + scale_x_discrete(label=function(x) customAbbreviate(x));
  
    if(barCount < 3) {
      gp = gp + theme(axis.text.x  = element_text(size=12), plot.title = element_text(colour=\"#b30000\"), panel.grid.major.x = element_blank());
    }
    else {
      gp = gp + theme(axis.text.x  = element_text(angle=45,vjust=1, hjust=1, size=12), plot.title = element_text(colour=\"#b30000\"), panel.grid.major.x = element_blank());
   #  gp = gp + theme(axis.text.x  = element_text(angle=90,vjust=0.5, size=12), plot.title = element_text(colour=\"#b30000\"), panel.grid.major.x = element_blank());
    }
  
  
  
  if($hideXAxisLabels) {
      gp = gp + theme(axis.text.x = element_blank(), axis.ticks.x = element_blank());
  }
  
    if(hideLegend) {
      gp = gp + theme(legend.position=\"none\");
    }
  
    if (nchar(levels(as.factor(profile.df.full\$NAME))[1]) >= 12) {
      gp = gp + theme(plot.margin = margin(l=45))
    }
  
  }
  
  if($horiz) {
    gp = gp + coord_flip();
  }
  
  
  gp = gp + geom_hline(yintercept = 0, colour=\"grey\")
  
  
  if($hasFacets) {
    gp = gp + facet_grid($facetString);
  }

  #postscript
  $rPostscript

}

plotlist[[plotlist.i]] = gp;
plotlist.i = plotlist.i + 1;





";

  return $rv;
}

1;

package EbrcWebsiteCommon::View::GraphPackage::GGBarPlot::RMA;
use base qw( EbrcWebsiteCommon::View::GraphPackage::GGBarPlot );
use strict;

sub new {
  my $class = shift;
  my $self = $class->SUPER::new(@_);

  my $id = $self->getId();
  my $wantLogged = $self->getWantLogged();

  $self->setYaxisLabel("RMA Value (log2)");
  $self->setIsLogged(1);

  # RMAExpress is log2
  if(defined($wantLogged) && $wantLogged eq '0') {
# TODO:  WHAT TO DO ABOUT ERROR BARS??
    $self->setAdjustProfile('profile.df.full$VALUE = 2^(profile.df.full$VALUE);');
    $self->setYaxisLabel("RMA Value");
    $self->setSkipStdErr(1);
  }

  $self->setDefaultYMax(4);
  $self->setDefaultYMin(0);

  $self->setPartName('rma');
  $self->setPlotTitle("RMA Expression Value - $id");

  return $self;
}

1;


package EbrcWebsiteCommon::View::GraphPackage::GGBarPlot::Percentile;
use base qw( EbrcWebsiteCommon::View::GraphPackage::GGBarPlot );
use strict;

sub new {
  my $class = shift; 
   my $self = $class->SUPER::new(@_);

   my $id = $self->getId();
   $self->setPartName('percentile');
   $self->setYaxisLabel('Percentile');
   $self->setDefaultYMax(100);
   $self->setDefaultYMin(0);
   $self->setIsLogged(0);

   $self->setPlotTitle("Percentile - $id");
   return $self;
}
1;



package EbrcWebsiteCommon::View::GraphPackage::GGBarPlot::RNASeqSpliced;
use base qw( EbrcWebsiteCommon::View::GraphPackage::GGBarPlot );
use strict;

sub new {
  my $class = shift; 
  my $self = $class->SUPER::new(@_);

  my $id = $self->getId();

  $self->setPartName('tpm');
  $self->setYaxisLabel('TPM');
  $self->setIsStacked(1);
  $self->setDefaultYMin(0);
  $self->setDefaultYMax(50);
  $self->setPlotTitle("TPM - $id");

  return $self;
}




package EbrcWebsiteCommon::View::GraphPackage::GGBarPlot::RNASeq;
use base qw( EbrcWebsiteCommon::View::GraphPackage::GGBarPlot );
use strict;
use Data::Dumper;

sub new {
  my ($class,$args,$profileSets) = @_;
  #print STDERR Dumper $args;

  my $self = $class->SUPER::new($args,$profileSets);

  my $id = $self->getId();
  my $wantLogged = $self->getWantLogged();
  my $exprMetric = $self->getExpressionMetric();
  
  $exprMetric = defined($exprMetric)? $exprMetric : "fpkm";
  
  $self->setPartName($exprMetric);
  $exprMetric = uc($exprMetric);
  $self->setYaxisLabel($exprMetric);
  $self->setIsStacked(1);
  $self->setDefaultYMin(0);
  $self->setDefaultYMax(10);
  $self->setPlotTitle("$exprMetric - $id");

  if($wantLogged) {
    $self->addAdjustProfile('profile.df.full$VALUE = log2(profile.df.full$VALUE + 1);');
    $self->setYaxisLabel("log2($exprMetric + 1)");
    $self->setIsLogged(1);
    $self->setDefaultYMax(4);
    $self->setSkipStdErr(1);
  }

  return $self;
}

#sub resetYAxisLabels {
#    my ($self, $exprMetric) = @_;
#    $self->setExpressionMetric($exprMetric);
#    $self->setPartName($exprMetric);
#    $exprMetric -> uc($exprMetric);
#    $self->setYaxisLabel($exprMetric);
#    my $id = $self->getId();
#    $self->setPlotTitle("$exprMetric - $id");
#
#    if ($self->getWantLogged) {
#        $self->setYaxisLabel("log2(TPM + 1)");
#    }
#}

package EbrcWebsiteCommon::View::GraphPackage::GGBarPlot::RNASeqSenseAntisense;
use base qw( EbrcWebsiteCommon::View::GraphPackage::GGBarPlot::RNASeq );
use strict;
use Data::Dumper;

sub new {
    my ($class,$args,$profileSets) = @_;
    my $self = $class->SUPER::new($args,$profileSets);

    my $strandDictionaryHash = $self->getStrandDictionaryHash();
    my @legendNames=();
    for(my $i = 0; $i < scalar @$profileSets; $i++) {
      my $profileSet = $profileSets->[$i];
      my $profileSetName = $profileSet->getName();
      my $strandType = "";
      if ($profileSetName =~ /(\w*strande?d?)/) {
        $strandType = $1;
      }
      my $sample = $strandDictionaryHash->{$strandType};
      if ($sample eq "sense") {
        $sample="  sense";
        if ($i == 1) {
          my $newProfileSets=[];
          $newProfileSets->[0] = $profileSets->[1];
          $newProfileSets->[1] = $profileSets->[0];
          $self->setProfileSets($newProfileSets);
	}
      }
      push @legendNames, $sample;
    }
    
    @legendNames = sort {$a cmp $b} @legendNames;
    $self->setLegendLabels(\@legendNames);
    $self->setIsStacked(0);

    return $self;
}

package EbrcWebsiteCommon::View::GraphPackage::GGBarPlot::PairedEndRNASeqStacked;
use base qw( EbrcWebsiteCommon::View::GraphPackage::GGBarPlot::RNASeq);
use strict;

sub new {
  my $class = shift; 
  my $self = $class->SUPER::new(@_);

  my $id = $self->getId();
  my $exprMetric = $self->getExpressionMetric();
  $exprMetric = defined($exprMetric) ? $exprMetric : "fpkm";

  $self->setPartName($exprMetric);
  $exprMetric = uc($exprMetric);
  $self->setYaxisLabel($exprMetric);
  $self->setPlotTitle("$exprMetric - $id");

  # RUM RPKM Are Not logged in the db
  # JB:  Cannot take the log2 of the diff profiles then add
#  if($wantLogged) {
#    $self->setAdjustProfile('profile.df=profile.df + 1; profile.df = log2(profile.df);');
#    $self->setYaxisLabel('RPKM (log2)');
#    $self->setIsLogged(1);
#    $self->setDefaultYMax(4);
#  }

  return $self;
}

#sub resetYAxisLabels {
#    my ($self, $exprMetric) = @_;
#    $self->setPartName($exprMetric);
#    $exprMetric -> uc($exprMetric);
#    $self->setYaxisLabel($exprMetric);
#    my $id = $self->getId();
#    $self->setPlotTitle("$exprMetric - $id");
#
#    if ($self->getWantLogged) {
#        $self->setYaxisLabel("log2(TPM + 1)");
#    }
#}

#--------------------------------------------------------------------------------

package EbrcWebsiteCommon::View::GraphPackage::GGBarPlot::LogRatio;
use base qw( EbrcWebsiteCommon::View::GraphPackage::GGBarPlot );
use strict;

sub new {
  my $class = shift; 
   my $self = $class->SUPER::new(@_);

   my $id = $self->getId();

   $self->setDefaultYMax(1);
   $self->setDefaultYMin(-1);
   $self->setYaxisLabel('Expression Value (log2 ratio)');

   $self->setPartName('exprn_val');
   $self->setPlotTitle("Log(ratio) - $id");

   $self->setMakeYAxisFoldInduction(1);
   $self->setIsLogged(1);

   return $self;
}

package EbrcWebsiteCommon::View::GraphPackage::GGBarPlot::QuantileNormalized;
use base qw( EbrcWebsiteCommon::View::GraphPackage::GGBarPlot );
use strict;

sub new {
  my $class = shift; 
   my $self = $class->SUPER::new(@_);

   my $id = $self->getId();

   $self->setDefaultYMax(4);
   $self->setDefaultYMin(0);
   $self->setYaxisLabel('Expression Value (log2)');

   $self->setPartName('exprn_val');
   $self->setPlotTitle("Expression Values (log2) - $id");

   $self->setMakeYAxisFoldInduction(0);
   $self->setIsLogged(1);

   return $self;
}

package EbrcWebsiteCommon::View::GraphPackage::GGBarPlot::MRNADecay;
use base qw( EbrcWebsiteCommon::View::GraphPackage::GGBarPlot );
use strict;

sub new {
  my $class = shift; 
   my $self = $class->SUPER::new(@_);

   my $id = $self->getId();

   $self->setDefaultYMax(4);
   $self->setDefaultYMin(0);
   $self->setYaxisLabel('Expression Value');

   $self->setPartName('exprn_val');
   $self->setPlotTitle("Expression Values - $id");

   $self->setMakeYAxisFoldInduction(0);
   $self->setIsLogged(0);

   return $self;
}


package EbrcWebsiteCommon::View::GraphPackage::GGBarPlot::Standardized;
use base qw( EbrcWebsiteCommon::View::GraphPackage::GGBarPlot );
use strict;

sub new {
  my $class = shift; 
   my $self = $class->SUPER::new(@_);

   my $id = $self->getId();

   $self->setDefaultYMax(1);
   $self->setDefaultYMin(0);
   $self->setYaxisLabel('Median Expr (standardized)');

   $self->setPartName('exprn_val');
   $self->setPlotTitle("Median Expr (standardized) - $id");

   $self->setMakeYAxisFoldInduction(0);
   $self->setIsLogged(1);

   return $self;
}

package EbrcWebsiteCommon::View::GraphPackage::GGBarPlot::MassSpec;
use base qw( EbrcWebsiteCommon::View::GraphPackage::GGBarPlot );
use strict;

sub new {
  my $class = shift; 
   my $self = $class->SUPER::new(@_);

   my $id = $self->getId();

   $self->setDefaultYMax(10);
   $self->setDefaultYMin(0);
   $self->setYaxisLabel('');

   $self->setPartName('mass_spec');
   $self->setPlotTitle("Mass Profile - $id");

   $self->setMakeYAxisFoldInduction(0);
   $self->setIsLogged(0);

   return $self;
}

package EbrcWebsiteCommon::View::GraphPackage::GGBarPlot::QuantMassSpec;
use base qw( EbrcWebsiteCommon::View::GraphPackage::GGBarPlot );
use strict;

sub new {
  my $class = shift; 
   my $self = $class->SUPER::new(@_);

   my $id = $self->getId();

   $self->setIsLogged(1);

   $self->setDefaultYMax(1);
   $self->setDefaultYMin(-1);
   $self->setYaxisLabel('Relative Abundance (log2 ratio)');

   $self->setPartName('exprn_val');
   $self->setPlotTitle("Quant Mass Spec Profile - $id");

   $self->setMakeYAxisFoldInduction(1);


   return $self;
}

package EbrcWebsiteCommon::View::GraphPackage::GGBarPlot::QuantMassSpecNonRatio;
use base qw( EbrcWebsiteCommon::View::GraphPackage::GGBarPlot );
use strict;

sub new {
  my $class = shift; 
   my $self = $class->SUPER::new(@_);

   my $id = $self->getId();

   $self->setDefaultYMax(4);
   $self->setDefaultYMin(0);
   $self->setYaxisLabel('Abundance (log2)');

   $self->setPartName('exprn_val');
   $self->setPlotTitle("Quant Mass Spec Profile - $id");

   return $self;
}

package EbrcWebsiteCommon::View::GraphPackage::GGBarPlot::QuantMassSpecNonRatioUnlogged;
use base qw( EbrcWebsiteCommon::View::GraphPackage::GGBarPlot );
use strict;

sub new {
  my $class = shift; 
   my $self = $class->SUPER::new(@_);

   my $id = $self->getId();

   $self->setDefaultYMax(20);
   $self->setDefaultYMin(0);
   $self->setYaxisLabel('Abundance');

   $self->setPartName('exprn_val');
   $self->setPlotTitle("Quant Mass Spec Profile - $id");

   return $self;
}



package EbrcWebsiteCommon::View::GraphPackage::GGBarPlot::SageTag;
use base qw( EbrcWebsiteCommon::View::GraphPackage::GGBarPlot );
use strict;

sub new {
  my $class = shift; 
   my $self = $class->SUPER::new(@_);

   my $id = $self->getId();

   $self->setDefaultYMax(0.01);
   $self->setDefaultYMin(0);
   $self->setYaxisLabel('Percents');

   $self->setPartName('sage_tags');
   $self->setPlotTitle("Sage Tag Profile - $id");

   $self->setMakeYAxisFoldInduction(0);
   $self->setIsLogged(0);

   return $self;
}



package EbrcWebsiteCommon::View::GraphPackage::GGBarPlot::Genera;
use base qw( EbrcWebsiteCommon::View::GraphPackage::GGBarPlot );
use strict;

sub new {
  my $class = shift; 
   my $self = $class->SUPER::new(@_);

   my $id = $self->getId();

   $self->setDefaultYMax(0.2);
   $self->setDefaultYMin(0);
   $self->setYaxisLabel('');

   $self->setPartName('genera');
   $self->setPlotTitle("Genera - $id");

   $self->setMakeYAxisFoldInduction(0);
   $self->setIsLogged(0);

  $self->setAxisPadding(1);
   $self->setSpaceBetweenBars(0);
   return $self;
}


1;


