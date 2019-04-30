package EbrcWebsiteCommon::View::GraphPackage::GGTilePlot;

use strict;
use vars qw( @ISA );

@ISA = qw( EbrcWebsiteCommon::View::GraphPackage::PlotPart );
use EbrcWebsiteCommon::View::GraphPackage::PlotPart;
use EbrcWebsiteCommon::View::GraphPackage::Util;
use EbrcWebsiteCommon::View::GraphPackage;
use Data::Dumper;

#--------------------------------------------------------------------------------

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

sub getStrandDictionaryHash      { $_[0]->{'_strand_dictionary_hash'        }}

sub blankPlotPart {
  my ($self) = @_;
  $self->blankGGPlotPart(@_);
}
#--------------------------------------------------------------------------------

sub new {
  my ($class,$args,$profileSets) = @_;

  my $self = $class->SUPER::new($args,$profileSets);

  $self->setAxisPadding(1.1);
  $self->setSkipStdErr(1);
   return $self;
}

#--------------------------------------------------------------------------------
sub makeRPlotString {
  my ($self, $idType) = @_;

  my $sampleLabels = $self->getSampleLabels();
  my $sampleLabelsString = EbrcWebsiteCommon::View::GraphPackage::Util::rStringVectorFromArray($sampleLabels, 'x.axis.label');
  my $overrideXAxisLabels = scalar @$sampleLabels > 0 ? "TRUE" : "FALSE";
  my $isSVG = lc($self->getFormat()) eq 'svg' ? 'TRUE' : 'FALSE'; 

  my ($profileFiles, $elementNamesFiles, $stderrFiles);

  my $blankGraph = $self->blankPlotPart();

  eval{
   ($profileFiles, $elementNamesFiles, $stderrFiles) = $self->makeFilesForR($idType);
  };

  if($@) {
    print STDERR $@;
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
  
  if(scalar @$profileSets == $skipped) {
    return $blankGraph;
  }

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

# allow minor adjustments to profile
$rAdjustProfile

y.max = max(c(y.max, profile.df.full\$VALUE, profile.df.full\$MAX_ERR), na.rm=TRUE);
y.min = min(c(y.min, profile.df.full\$VALUE, profile.df.full\$MIN_ERR), na.rm=TRUE);

gp = ggplot(profile.df.full, aes(x=NAME, y=LEGEND, fill=VALUE));

if($isSVG) {
  useTooltips=TRUE;
}else{
  useTooltips=FALSE;
}

if(useTooltips) {
  gp = gp + geom_tooltip(aes(tooltip=NAME), color = \"white\", real.geom=geom_tile);
} else {
  gp = gp + geom_tile(color=\"white\");
}

if($hasColorVals) {
  #to make custom gradients
  gp = gp + scale_fill_gradientn(values = $colorVals, colors = names($colorVals), name=NULL)
} else {
  if($forceAutoColors) {
    gp = gp + scale_fill_gradient();
  } else {
    if (length($colorsStringNotNamed) == 2) {
      gp = gp + scale_fill_gradient(low = $colorsStringNotNamed[1], high = $colorsStringNotNamed[2], name=NULL);  
    } else if (length($colorsStringNotNamed) == 3) {
      gp = gp + scale_fill_gradient2(low = $colorsStringNotNamed[1], mid = $colorsStringNotNamed[2], high = $colorsStringNotNamed[3], name=NULL); 
    } else {
      stop(\"Must create custom gradient with colorVals, pass 2-3 colors to make a gradient with, or allow ggplot to make a gradient automatically.\")
  }
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
  } else {
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
  } else {
    gp = gp + theme(axis.text.x  = element_text(angle=45,vjust=1, hjust=1, size=12), plot.title = element_text(colour=\"#b30000\"), panel.grid.major.x = element_blank());
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

if($hasFacets) {
  gp = gp + facet_grid($facetString);
}

plotlist[[plotlist.i]] = gp;
plotlist.i = plotlist.i + 1;

";

  return $rv;
}

1;

package EbrcWebsiteCommon::View::GraphPackage::GGTilePlot::RNASeq;
use base qw( EbrcWebsiteCommon::View::GraphPackage::GGTilePlot );
use strict;

sub new {
  my ($class,$args,$profileSets) = @_;
  my $self = $class->SUPER::new($args,$profileSets);

  my $id = $self->getId();

  $self->setPartName('fpkm');
  $self->setYaxisLabel('FPKM');
  $self->setPlotTitle("FPKM - $id");

  return $self;
}
