
package EbrcWebsiteCommon::View::GraphPackage::GGBarPlot;

use strict;
use vars qw( @ISA );

@ISA = qw( EbrcWebsiteCommon::View::GraphPackage::PlotPart );
use EbrcWebsiteCommon::View::GraphPackage::PlotPart;
use EbrcWebsiteCommon::View::GraphPackage::Util;
use EbrcWebsiteCommon::View::GraphPackage;
use Data::Dumper;

#--------------------------------------------------------------------------------

sub getIsStacked                 { $_[0]->{'_stack_bars'                     }}
sub setIsStacked                 { $_[0]->{'_stack_bars'                     } = $_[1]}

sub getForceHorizontalXAxis      { $_[0]->{'_force_x_horizontal'             }}
sub setForceHorizontalXAxis      { $_[0]->{'_force_x_horizontal'             } = $_[1]}

sub getIsHorizontal              { $_[0]->{'_is_horizontal'                  }}
sub setIsHorizontal              { $_[0]->{'_is_horizontal'                  } = $_[1]}

sub getHighlightMissingValues    { $_[0]->{'_highlight_missing_values'       }}
sub setHighlightMissingValues    { $_[0]->{'_highlight_missing_values'       } = $_[1]}

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

sub blankPlotPart {
  my ($self) = @_;
  $self->blankGGPlotPart(@_);
}
#--------------------------------------------------------------------------------

sub new {
  my $class = shift;

   my $self = $class->SUPER::new(@_);

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

  my ($profileFiles, $elementNamesFiles, $stderrFiles);

  my $blankGraph = $self->blankPlotPart();

  eval{
   ($profileFiles, $elementNamesFiles, $stderrFiles) = $self->makeFilesForR($idType);
  };

  if($@) {
    return $blankGraph;
  }

  my $profileSets = $self->getProfileSets();
  my @skipProfileSets;
  my $skipped = 0;

  my $colors = $self->getColors();

  for(my $i = 0; $i < scalar @$profileSets; $i++) {
    my $profileSet = $profileSets->[$i];

    if(scalar @{$profileSet->errors()} > 0) {
      $skipProfileSets[$i] = "TRUE";
      $skipped++;
      if ($skipped == 1) {
        splice @$colors, $i, 1;
      } else {
        #this because the size/ indexing of $colors shrinks as values removed.
        my $j = $i - $skipped + 1;
        splice @$colors, $j, 1;
      }
      next;
    }
    $skipProfileSets[$i] = "FALSE";
  }
  #print STDERR Dumper($colors);
  if(scalar @$profileSets == $skipped) {
    return $blankGraph;
  }

  #foreach(@{$self->getProfileSets()}) {
  #  if(scalar @{$_->errors()} > 0) {
  #    return $blankGraph;
  # 
  #  }
  #}

  #count number of profiles for current plot part
  my @elemFileStrings = split(/,/, $elementNamesFiles);
  my $lines = 0;
  foreach my $i (@elemFileStrings) {
    my ($elemFile) = $i =~ /"(.*?)"/;
    open(FILE, $elemFile) or die "Can't open `$elemFile`: $!";
    while (sysread FILE, my $buffer, 4096) {
      $lines += ($buffer =~ tr/\n//);
    }
    close FILE;
    $lines = $lines - 1;
  }
  my $numProfiles = $lines;

  my $skipProfilesString = EbrcWebsiteCommon::View::GraphPackage::Util::rBooleanVectorFromArray(\@skipProfileSets, 'skip.profiles');
  my $colorsString = EbrcWebsiteCommon::View::GraphPackage::Util::rStringVectorFromArray($colors, 'the.colors');
  my $colorsStringNotNamed = EbrcWebsiteCommon::View::GraphPackage::Util::rStringVectorFromArrayNotNamed($colors);

  my $forceAutoColors = defined($self->forceAutoColors()) ? 'TRUE' : 'FALSE';

  my $rAdjustProfile = $self->getAdjustProfile();
  my $yAxisLabel = $self->getYaxisLabel();
  my $plotTitle = $self->getPlotTitle();

  my $yMax = $self->getDefaultYMax();
  my $yMin = $self->getDefaultYMin();

  my $axisLty = $self->getAxisLty();
  my $axisLtyString = defined($axisLty) ? 'TRUE' : 'FALSE';
  $axisLty = defined($axisLty)? $axisLty : 'NULL';

  my $las = $self->getLas();
  my $lasString = defined($las) ? 'TRUE' : 'FALSE';
  $las = defined($las) ? $las : 'NULL';

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

  my $yAxisFoldInductionFromM = $self->getMakeYAxisFoldInduction();
  my $highlightMissingValues = $self->getHighlightMissingValues();

  $highlightMissingValues = $highlightMissingValues ? 'TRUE' : 'FALSE';

  $rAdjustProfile = $rAdjustProfile ? $rAdjustProfile : "";

  $horizontalXAxisLabels = $horizontalXAxisLabels ? 'TRUE' : 'FALSE';

  $yAxisFoldInductionFromM = $yAxisFoldInductionFromM ? 'TRUE' : 'FALSE';

  my $horiz = $isHorizontal && !$self->isCompact() ? 'TRUE' : 'FALSE';

  my $hideXAxisLabels = $self->getHideXAxisLabels() ? 'TRUE' : 'FALSE';

  my $titleLine = $self->getTitleLine();

  my $bottomMargin = $self->getElementNameMarginSize();
  my $spaceBetweenBars = $self->getSpaceBetweenBars();

  my $scale = $self->getScalingFactor;

  my $hasExtraLegend = $self->getHasExtraLegend() ? 'TRUE' : 'FALSE';
  my $legendLabels = $self->getLegendLabels();

  my ($legendLabelsString, $legendColors, $legendColorsString);

  my $profileTypes = $self->getProfileTypes();
  my $profileTypesString = EbrcWebsiteCommon::View::GraphPackage::Util::rStringVectorFromArray($profileTypes, 'profile.types');

  my $facets = $self->getFacets();
  my $facetString = ". ~ DUMMY";
  my $hasFacets = "FALSE";

  if ($facets && scalar @$facets != 0) {
    if(scalar @$facets == 1 && $facets->[0] ne 'none') {
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

$profileFiles
$elementNamesFiles
$stderrFiles
$colorsString
$sampleLabelsString
$legendLabelsString
$legendColorsString
$profileTypesString
$skipProfilesString

is.compact=$isCompactString;
is.thumbnail=$isThumbnail;

#-------------------------------------------------------------------

if(length(profile.files) != length(element.names.files)) {
  stop(\"profile.files length not equal to element.names.files length\");
}

y.min = $yMin;
y.max = $yMax;

profile.df.full = data.frame();

for(ii in 1:length(profile.files)) {
  skip.stderr = FALSE;
  if ($skipStdErr) {
    skip.stderr = TRUE
  }

  if(skip.profiles[ii]) {
    next;
  };

  profile.df = read.table(profile.files[ii], header=T, sep=\"\\t\");
  profile.df\$Group.1=NULL

  if(!is.null(profile.df\$ELEMENT_ORDER)) {
    eo.count = length(profile.df\$ELEMENT_ORDER);
    if(!is.numeric(profile.df\$ELEMENT_ORDER)) {
      stop(\"Element order must be numeric for aggregation\");
    }

    profile.df = aggregate(profile.df, list(profile.df\$ELEMENT_ORDER), mean, na.rm=T)
    if(length(profile.df\$ELEMENT_ORDER) != eo.count) {
      skip.stderr = TRUE;
    }

    profile.df\$PROFILE_FILE = profile.files[ii];
    profile.df\$PROFILE_TYPE = profile.types[ii];

    if(length(profile.files) > 1) {
      profile.df\$LEGEND = legend.label[ii];
    }

  }

  element.names.df = read.table(element.names.files[ii], header=T, sep=\"\\t\");

  #this assumes that the manual override has the right number of entries and in the right order
  if(length(x.axis.label) == length(element.names.df\$NAME) && $overrideXAxisLabels){
    element.names.df\$NAME = x.axis.label
  }

  profile.df = merge(profile.df, element.names.df[, c(\"ELEMENT_ORDER\", \"NAME\")], by=\"ELEMENT_ORDER\")

  if(!skip.stderr && !is.na(stderr.files[ii]) && stderr.files[ii] != '') {
    stderr.df = read.table(stderr.files[ii], header=T, sep=\"\\t\");
    names(stderr.df)[names(stderr.df) == \"VALUE\"] <- \"STDERR\"

    profile.df = merge(profile.df, stderr.df[, c(\"ELEMENT_ORDER\", \"STDERR\")], by=\"ELEMENT_ORDER\", all=TRUE);
  } else {
    profile.df\$STDERR = NA;
  }

  profile.df.full = rbind(profile.df.full, profile.df);
}

#if(abs(sum(profile.df.full\$VALUE, na.rm=TRUE)) <= 0){
#  d = data.frame(VALUE=0.5, LABEL=\"None\");
#  gp = ggplot() + geom_blank() + geom_text(data=d, mapping=aes(x=VALUE, y=VALUE, label=LABEL), size=10) + theme_void() + theme(legend.position=\"none\");
#} else {

profile.df.full\$MIN_ERR = profile.df.full\$VALUE - profile.df.full\$STDERR;
profile.df.full\$MAX_ERR = profile.df.full\$VALUE + profile.df.full\$STDERR;

if(length(profile.files) == 1) {
  profile.df.full\$LEGEND = legend.label;
  if($overrideXAxisLabels) {
    profile.df.full\$NAME = x.axis.label;    
  }
}

profile.df.full\$NAME <- factor(profile.df.full\$NAME, levels = unique(profile.df.full\$NAME[order(profile.df.full\$ELEMENT_ORDER)]))

expandColors = FALSE;
hideLegend = FALSE;

if($numProfiles > length($colorsStringNotNamed)) {
  expandColors=TRUE;
}

if(is.null(profile.df.full\$LEGEND)) {
  profile.df.full\$LEGEND = as.factor(profile.df.full\$NAME)
  expandColors = TRUE;
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
  gp = gp + scale_fill_manual(values = $colorVals, breaks = names($colorVals))
  gp = gp + scale_color_manual(values = $colorVals, breaks = names($colorVals))
} else if (expandColors) {
 #!!!!!!!!!!!!!!!!! i believe the below will only work when length(NAME)/length(colorstring) divides evenly
  gp = gp + scale_fill_manual(values=rep($colorsStringNotNamed, $numProfiles/length($colorsStringNotNamed)), breaks=profile.df.full\$LEGEND, name=NULL);
  gp = gp + scale_colour_manual(values=rep($colorsStringNotNamed, $numProfiles/length($colorsStringNotNamed)), breaks=profile.df.full\$LEGEND, name=NULL);
} else {
  if($forceAutoColors) {
#    numColors = length(levels(as.factor(profile.df.full\$LEGEND)));
#    gp = gp + scale_fill_manual(values=viridis(numColors), breaks=profile.df.full\$LEGEND, name=NULL);  
#    gp = gp + scale_colour_manual(values=viridis(numColors), breaks=profile.df.full\$LEGEND, name=NULL);

     gp = gp + scale_fill_brewer(palette=\"Set1\");
     gp = gp + scale_colour_brewer(palette=\"Set1\");
  }
  else {
    gp = gp + scale_fill_manual(values=$colorsStringNotNamed, breaks=profile.df.full\$LEGEND, name=NULL);  
    gp = gp + scale_colour_manual(values=$colorsStringNotNamed, breaks=profile.df.full\$LEGEND, name=NULL);
  }
}

gp = gp + geom_errorbar(aes(ymin=MIN_ERR, ymax=MAX_ERR), colour=\"black\", width=.1);

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

}

if($horiz) {
  gp = gp + coord_flip();
}


gp = gp + geom_hline(yintercept = 0, colour=\"grey\")


if($hasFacets) {
  gp = gp + facet_grid($facetString);
}

#}

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

  $self->setPartName('rpm');
  $self->setYaxisLabel('RPM');
  $self->setIsStacked(1);
  $self->setDefaultYMin(0);
  $self->setDefaultYMax(50);
  $self->setPlotTitle("RPM - $id");

  return $self;
}




package EbrcWebsiteCommon::View::GraphPackage::GGBarPlot::RNASeq;
use base qw( EbrcWebsiteCommon::View::GraphPackage::GGBarPlot );
use strict;

sub new {
  my $class = shift; 
  my $self = $class->SUPER::new(@_);

  my $id = $self->getId();
  my $wantLogged = $self->getWantLogged();

  $self->setPartName('fpkm');
  $self->setYaxisLabel('FPKM');
  $self->setIsStacked(1);
  $self->setDefaultYMin(0);
  $self->setDefaultYMax(10);
  $self->setPlotTitle("FPKM - $id");

  if($wantLogged) {
    $self->addAdjustProfile('profile.df.full$VALUE = log2(profile.df.full$VALUE + 1);');
    $self->setYaxisLabel('FPKM (log2)');
    $self->setIsLogged(1);
    $self->setDefaultYMax(4);
    $self->setSkipStdErr(1);
  }

  return $self;
}

package EbrcWebsiteCommon::View::GraphPackage::GGBarPlot::PairedEndRNASeqStacked;
use base qw( EbrcWebsiteCommon::View::GraphPackage::GGBarPlot::RNASeq);
use strict;

sub new {
  my $class = shift; 
  my $self = $class->SUPER::new(@_);

  my $id = $self->getId();

  $self->setPartName('fpkm');
  $self->setYaxisLabel('FPKM');
  $self->setPlotTitle("FPKM - $id");

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


