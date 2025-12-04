package EbrcWebsiteCommon::View::GraphPackage::GGPiePlot;

use strict;
use vars qw( @ISA );

@ISA = qw( EbrcWebsiteCommon::View::GraphPackage::PlotPart );
use EbrcWebsiteCommon::View::GraphPackage::PlotPart;
use EbrcWebsiteCommon::View::GraphPackage::Util;
use EbrcWebsiteCommon::View::GraphPackage;

use Data::Dumper;
use LWP::UserAgent;

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

sub getIsDonut                      { $_[0]->{'_is_donut'                         }}
sub setIsDonut                      { $_[0]->{'_is_donut'                         } = $_[1]}


sub blankPlotPart {
  my ($self) = @_;
  $self->blankGGPlotPart(@_);
}

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


sub new {
  my $class = shift;

   my $self = $class->SUPER::new(@_);

   $self->setYaxisLabel("Expression Value \\n (log2 ratio) \\n");

   return $self;
}

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

sub makeRPlotString {
  my ($self, $idType) = @_;

  my $sampleLabels = $self->getSampleLabels();

  my $sampleLabelsString = EbrcWebsiteCommon::View::GraphPackage::Util::rStringVectorFromArray($sampleLabels, 'x.axis.label');

  my $overrideXAxisLabels = scalar @$sampleLabels > 0 ? "TRUE" : "FALSE";

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

  my $rAdjustProfile = $self->getAdjustProfile();
  my $yAxisLabel = $self->getYaxisLabel();
  my $xAxisLabel = $self->getXaxisLabel();
  my $plotTitle = $self->getPlotTitle();
  my $subtitle = $self->getSubtitle();

  my $hideXAxisLabels = $self->getHideXAxisLabels() ? 'TRUE' : 'FALSE';

  my $rPostscript = $self->getRPostscript();

  my $isThumbnail = "FALSE";

  if($self->getThumbnail()) {
    $isThumbnail = "TRUE";
  }

  my $isCompactString = "FALSE";

  if($self->isCompact()) {
    $isCompactString = "TRUE";
  }

  $rAdjustProfile = $rAdjustProfile ? $rAdjustProfile : "";

  $rPostscript = $rPostscript ? $rPostscript : "";

  my $facets = $self->getFacets();
  my $facetString = "DUMMY";
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

  my $removeNaN = $self->getRemoveNaN() ? 'TRUE' : 'FALSE';

  my $hasExtraLegend = $self->getHasExtraLegend() ? 'TRUE' : 'FALSE';
  my $extraLegendSize = $self->getExtraLegendSize();

  my $titleLine = $self->getTitleLine();

  my $scale = $self->getScalingFactor;

  my $legendLabels = $self->getLegendLabels;

  my $legendLabelsString = EbrcWebsiteCommon::View::GraphPackage::Util::rStringVectorFromArray($legendLabels, 'legend.label');

  my $isDonut = $self->getIsDonut() ? 'TRUE' : 'FALSE';

  my $hasLegendLabels = $legendLabelsString ? 'TRUE' : 'FALSE';
  my $rv = "
#-------------------------- PIE PLOT ------------------------------

$colorsString
$sampleLabelsString
$legendLabelsString

is.compact=$isCompactString;
is.thumbnail=$isThumbnail;

#-------------------------------------------------

profile.df.full = fromJSON('$plotDataJson');

names(profile.df.full) <- toupper(names(profile.df.full))

if(class(profile.df.full) == 'list'){

  d = data.frame(VALUE=0.5, LABEL=\"None\");
  gp = ggplot() + geom_blank() + geom_text(data=d, mapping=aes(x=VALUE, y=VALUE, label=LABEL), size=10) + theme_void() + theme(legend.position=\"none\");

} else {

  if (\"standard_error\" %in% profile.df.full\$PROFILE_TYPE) {
  #  if (skip.stderr) {
  #    profile.df.full <- profile.df.full[profile.df.full\$PROFILE_TYPE != 'standard_error',]
  #    profile.df.full\$STDERR <- NA
  #  } else {
      profile.values <- profile.df.full[profile.df.full\$PROFILE_TYPE != 'standard_error',]
      profile.stderr <- profile.df.full[profile.df.full\$PROFILE_TYPE == 'standard_error',]
      profile.stderr\$PROFILE_TYPE <- NULL
      profile.stderr\$PROFILE_ORDER <- NULL
      names(profile.stderr)[names(profile.stderr) == 'VALUE'] <- 'STDERR'
      profile.df.full <- merge(profile.values, profile.stderr, by = c('PROFILE_SET_NAME', 'NAME', 'ELEMENT_ORDER'), all.x=TRUE)
      profile.df.full <- profile.df.full[order(profile.df.full\$PROFILE_ORDER, profile.df.full\$ELEMENT_ORDER),]
      profile.df.full\$STDERR <- as.numeric(profile.df.full\$STDERR)
  #  }
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
 
  profile.df.full\$ELEMENT_NAMES_NUMERIC = as.numeric(gsub(\" *[a-z-A-Z()+-]+ *\", \"\", profile.df.full\$NAME, perl=T))
 
  #allow adjustments
  $rAdjustProfile
  
  if (!exists(\"profile.is.numeric\")) {
    profile.is.numeric = sum(!is.na(profile.df.full\$ELEMENT_NAMES_NUMERIC)) == nrow(profile.df.full);
  }

  if($removeNaN){
    profile.df.full = completeDF(profile.df.full, \"VALUE\");
  }

  if($isSVG) {
    useTooltips=TRUE;
  }else{
    useTooltips=FALSE;
  }
  
  #determine how many levels there are to NAME col so we can set pie plot into equal parts
  profile.df.full\$FRAC <- 100*(1/length(profile.df.full\$NAME));
  #rescale values from 0 to 1 so they can be understood by the gradient color palette
  profile.df.full\$RESCALE <- rescale(profile.df.full\$VALUE);
  
  if ($isDonut) {
    gp = ggplot(profile.df.full, aes(x=2, y=FRAC, fill=RESCALE)) + xlim(0.5, 2.5);
  } else {
    gp = ggplot(profile.df.full, aes(x=\"\", y=FRAC, fill=RESCALE));
  }
  
  #if (useTooltips) {
  #  gp = gp + geom_tooltip(aes(tooltip=NAME), real.geom=geom_bar, stat = \"identity\");
  #} else {
    gp = gp + geom_bar(stat = \"identity\");
  #}
  
  gp = gp + coord_polar(theta = \"y\");
  
  
  #in order to map red to >1 and green to <-1 will need to know how these values map to the rescaled values
  
  #find rescaled val where normal val reaches < -1
  if (any(profile.df.full\$VALUE < -1)) {
    low <- sort(profile.df.full\$RESCALE)[length(profile.df.full\$VALUE[profile.df.full\$VALUE < -1])]
    llab <- sort(profile.df.full\$VALUE)[length(profile.df.full\$VALUE[profile.df.full\$VALUE < -1])]
  } else {
    low <- 0
    llab <- min(profile.df.full\$VALUE)
  }
  
  #find rescaled val which is median between normal 1 and -1 vals
  if (any(profile.df.full\$VALUE == 0)) {
    mid <- profile.df.full\$RESCALE[profile.df.full\$VALUE == 0][1]
    mlab <- 0 
  } else {
    val <- min(abs(profile.df.full\$VALUE - 0))
    if (!any(profile.df.full\$VALUE == val)) {
      val = val * -1
    }
    mid <- profile.df.full\$RESCALE[profile.df.full\$VALUE == val][1]
    mlab <- profile.df.full\$VALUE[profile.df.full\$VALUE == val][1]
  }
  
  #find rescaled val where normal val reaches > 1
  if (any(profile.df.full\$VALUE > 1)) {
    high <- sort(profile.df.full\$RESCALE)[length(profile.df.full\$VALUE) - length(profile.df.full\$VALUE[profile.df.full\$VALUE > 1] + 1)]
    hlab <- sort(profile.df.full\$VALUE)[length(profile.df.full\$VALUE) - length(profile.df.full\$VALUE[profile.df.full\$VALUE > 1] + 1)]
  } else {
    high <- 1
    hlab <- max(profile.df.full\$VALUE)
  }
  
  #plot some ticks in the legend for the points midway between high and mid and low and mid
  hmtarget <- (hlab - mlab) / 2
  lmtarget <- (llab - mlab) / 2
  #now find the actual VALUEs nearest to these ones and set to labs, then their RESCALE equivalents to hm and lm
  val <- min(abs(profile.df.full\$VALUE - hmtarget))
  if (!any(hmtarget == (profile.df.full\$VALUE + val))) {
    val = val * -1
  }
  hm <- profile.df.full\$RESCALE[hmtarget == (profile.df.full\$VALUE + val)][1]
  hmlab <- profile.df.full\$VALUE[hmtarget == (profile.df.full\$VALUE + val)][1]
  val <- min(abs(profile.df.full\$VALUE - lmtarget))
  if (!any(lmtarget == (profile.df.full\$VALUE + val))) {
    val = val * -1
  }
  lm <- profile.df.full\$RESCALE[lmtarget == (profile.df.full\$VALUE + val)][1]
  lmlab <- profile.df.full\$VALUE[lmtarget == (profile.df.full\$VALUE + val)][1]
  
  if (low == 0) {
    if (high == 1) {
      myColors = c(\"red\", \"yellow\", \"green\")
      myValues = c(high, mid, low)
      myBreaks = c(high, hm, mid, lm, low)
      myLabels = round(c(hlab, hmlab, mlab, lmlab, llab), digits=4)
    } else {
      myColors = c(\"darkred\", \"red\", \"yellow\", \"green\")
      myValues = c(1, high, mid, low)
      myBreaks = c(1, high, hm, mid, lm, low)
      myLabels = round(c(max(profile.df.full\$VALUE), hlab, hmlab, mlab, lmlab, llab), digits=4)
    }
  } else {
    if (high == 1) {
      myColors = c(\"red\", \"yellow\", \"green\", \"darkgreen\")
      myValues = c(high, mid, low, 0)
      myBreaks = c(high, hm, mid, lm, low, 0)
      myLabels = round(c(hlab, hmlab, mlab, lmlab, llab, min(profile.df.full\$VALUE)), digits=4)
    } else {
      myColors = c(\"darkred\", \"red\", \"yellow\", \"green\", \"darkgreen\")
      myValues = c(1, high, mid, low, 0)
      myBreaks = c(1, high, hm, mid, lm, low, 0)
      myLabels = round(c(max(profile.df.full\$VALUE), hlab, hmlab, mlab, lmlab, llab, min(profile.df.full\$VALUE)), digits=4)
    }
  }
  
  gp = gp + scale_fill_gradientn(name = \"$yAxisLabel\", colors = myColors, values = myValues, breaks = myBreaks, labels = myLabels)
  
  if(is.compact) {
    gp = gp + theme_void() + theme(legend.position=\"none\");
  } else if(is.thumbnail) {
    gp = gp + theme_bw();
    gp = gp + labs(title=\"$plotTitle\", y=\"\", x=NULL);
    gp = gp + theme(legend.position=\"none\");
    gp = gp + theme(panel.grid = element_blank());
    gp = gp + theme(axis.text = element_blank());
    gp = gp + theme(axis.ticks = element_blank());
  } else {
    gp = gp + theme_bw();
    gp = gp + labs(title=\"$plotTitle\", y=\"\", x=NULL);
    gp = gp + theme(panel.grid = element_blank());
    gp = gp + theme(axis.text = element_blank());
    gp = gp + theme(axis.ticks = element_blank());
    if($hideXAxisLabels) {
      gp = gp + theme(axis.text.x = element_blank(), axis.ticks.x = element_blank());
    }
  }
  
  if($hasFacets) {
    gp = gp + facet_grid($facetString);
  }
  
  $rPostscript

}

plotlist[[plotlist.i]] = gp;
plotlist.i = plotlist.i + 1;


";

  return $rv;
}

1;

# package EbrcWebsiteCommon::View::GraphPackage::GGPiePlot::MPMP;
# use base qw( EbrcWebsiteCommon::View::GraphPackage::GGPiePlot );
# use strict;

# sub new {
#   my $class = shift;
#   my $self = $class->SUPER::new(@_);
#   my $id = $self->getId();

#   #$self->setIsDonut('TRUE');
#   ##also set Radjust here to add num for max time point to center
#   $self->setRPostscript("gp = gp + annotate(\"text\", x = 0, y = 0, label = profile.df.full\$ELEMENT_NAMES_NUMERIC[profile.df.full\$VALUE == max(profile.df.full\$VALUE)][1], size = 16)");
#   return $self;
# }

# 1;
