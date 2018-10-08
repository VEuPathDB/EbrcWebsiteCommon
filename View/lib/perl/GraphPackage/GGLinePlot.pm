package EbrcWebsiteCommon::View::GraphPackage::GGLinePlot;

use strict;
use vars qw( @ISA );

@ISA = qw( EbrcWebsiteCommon::View::GraphPackage::PlotPart );
use EbrcWebsiteCommon::View::GraphPackage::PlotPart;
use EbrcWebsiteCommon::View::GraphPackage::Util;
use EbrcWebsiteCommon::View::GraphPackage;

use Data::Dumper;
#--------------------------------------------------------------------------------

sub getIsFilled                  { $_[0]->{'_is_filled'                     }}
sub setIsFilled                  { $_[0]->{'_is_filled'                     } = $_[1]}

sub getForceNoLines              { $_[0]->{'_force_no_lines'                }}
sub setForceNoLines              { $_[0]->{'_force_no_lines'                } = $_[1]}

sub getVaryGlyphByXAxis          { $_[0]->{'_vary_glyph_by_x_axis'          }}
sub setVaryGlyphByXAxis          { $_[0]->{'_vary_glyph_by_x_axis'          } = $_[1]}

sub getPointsPch                 { $_[0]->{'_points_pch'                    }}
sub setPointsPch                 { $_[0]->{'_points_pch'                    } = $_[1]}

sub getDefaultXMax               { $_[0]->{'_default_x_max'                 }}
sub setDefaultXMax               { $_[0]->{'_default_x_max'                 } = $_[1]}

sub getDefaultXMin               { $_[0]->{'_default_x_min'                 }}
sub setDefaultXMin               { $_[0]->{'_default_x_min'                 } = $_[1]}

sub getAdjustXYScalesTogether    { $_[0]->{'_adjust_xy_scales_together'     }}
sub setAdjustXYScalesTogether    { $_[0]->{'_adjust_xy_scales_together'     } = $_[1]}

sub getAntisenseFloor            { $_[0]->{'antisense_floor'                }}
sub setAntisenseFloor            { $_[0]->{'antisense_floor'                } = $_[1]}

sub getAntisenseFoldChange       { $_[0]->{'antisense_fold_change'          }}
sub setAntisenseFoldChange       { $_[0]->{'antisense_fold_change'          } = $_[1]}

sub getSenseFoldChange           { $_[0]->{'sense_fold_change'              }}
sub setSenseFoldChange           { $_[0]->{'sense_fold_change'              } = $_[1]}

sub getArePointsLast             { $_[0]->{'_are_points_last'               }}
sub setArePointsLast             { $_[0]->{'_are_points_last'               } = $_[1]}

sub getSmoothLines               { $_[0]->{'_smooth_lines'                  }}
sub setSmoothLines               { $_[0]->{'_smooth_lines'                  } = $_[1]}

sub getSmoothWithLoess           { $_[0]->{'_smooth_with_loess'             }}
sub setSmoothWithLoess           { $_[0]->{'_smooth_with_loess'             } = $_[1]}

sub getPanOut                    { $_[0]->{'_pan_out'                       }}
sub setPanOut                    { $_[0]->{'_pan_out'                       } = $_[1]}

sub getSplineApproxN             { $_[0]->{'_spline_approx_n'               }}
sub setSplineApproxN             { $_[0]->{'_spline_approx_n'               } = $_[1]}

sub getSplineDF                  { $_[0]->{'_spline_degrees_of_freedom'     }}
sub setSplineDF                  { $_[0]->{'_spline_degrees_of_freedom'     } = $_[1]}

sub getHasMetaData               { $_[0]->{'_has_meta_data'                 }}
sub setHasMetaData               { $_[0]->{'_has_meta_data'                 } = $_[1]}

sub getForceConnectPoints        { $_[0]->{'_force_connect_points'          }}
sub setForceConnectPoints        { $_[0]->{'_force_connect_points'          } = $_[1]}

sub getTimeline                  { $_[0]->{'_time_line'                     }}
sub setTimeline                  { $_[0]->{'_time_line'                     } = $_[1]}

sub getColorVals                 { $_[0]->{'_color_vals'                    }}
sub setColorVals                 { $_[0]->{'_color_vals'                    } = $_[1]}

sub getColorLabels               { $_[0]->{'_color_labs'                    }}
sub setColorLabels               { $_[0]->{'_color_labs'                    } = $_[1]}

sub getFillVals                  { $_[0]->{'_fill_vals'                     }}
sub setFillVals                  { $_[0]->{'_fill_vals'                     } = $_[1]}

sub getFillLabels                { $_[0]->{'_fill_labs'                     }}
sub setFillLabels                { $_[0]->{'_fill_labs'                     } = $_[1]}

sub getCustomBreaks              { $_[0]->{'_custom_breaks'                 }}
sub setCustomBreaks              { $_[0]->{'_custom_breaks'                 } = $_[1]}

sub getFacetNumCols              { $_[0]->{'_facet_num_cols'                }}
sub setFacetNumCols              { $_[0]->{'_facet_num_cols'                } = $_[1]}

sub getColorPointsOnly           { $_[0]->{'_color_points_only'             }}
sub setColorPointsOnly           { $_[0]->{'_color_points_only'             } = $_[1]}

sub blankPlotPart {
  my ($self) = @_;
  $self->blankGGPlotPart(@_);
}

#--------------------------------------------------------------------------------

sub new {
  my $class = shift;
    
  my $self = $class->SUPER::new(@_);
    
  $self->setXaxisLabel("Whoops! Object forgot to call setXaxisLabel");
  $self->setDefaultYMax(1);
  $self->setDefaultYMin(-1);
  return $self;
}

#--------------------------------------------------------------------------------

sub makeRPlotString {
  my ($self, $idType) = @_;
    
  my $sampleLabels = $self->getSampleLabels();
    
  my $sampleLabelsString = EbrcWebsiteCommon::View::GraphPackage::Util::rStringVectorFromArray($sampleLabels, 'x.axis.label');
    
  my $overrideXAxisLabels = scalar @$sampleLabels > 0 ? "TRUE" : "FALSE";
    
  my $isSVG = lc($self->getFormat()) eq 'svg' ? 'TRUE' : 'FALSE';
    
  my $colors = $self->getColors();
        
  my $defaultPch = [ '15', '16', '17', '18', '7:10', '0:6'];
    
  my $pointsPch = $self->getPointsPch();
  $pointsPch = $defaultPch unless $pointsPch;
    
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
    
  my @profileFileStrings = split(/,/, $profileFiles);
  my $numProfiles = scalar @profileFileStrings;
    
  my $skipProfilesString = EbrcWebsiteCommon::View::GraphPackage::Util::rBooleanVectorFromArray(\@skipProfileSets, 'skip.profiles');
  my $colorsString = EbrcWebsiteCommon::View::GraphPackage::Util::rStringVectorFromArray($colors, 'the.colors');
  my $colorsStringNotNamed = EbrcWebsiteCommon::View::GraphPackage::Util::rStringVectorFromArrayNotNamed($colors);
    
  my $pointsPchString = EbrcWebsiteCommon::View::GraphPackage::Util::rNumericVectorFromArray($pointsPch, 'points.pch');
    
  my $rAdjustProfile = $self->getAdjustProfile();
  my $yAxisLabel = $self->getYaxisLabel();
  my $xAxisLabel = $self->getXaxisLabel();
  my $plotTitle = $self->getPlotTitle();
  my $subtitle = $self->getSubtitle();
  my $statusLegend = $self->getStatusLegend();
  $statusLegend = $statusLegend ? $statusLegend : '';
  my $eventDurLegend = $self->getEventDurLegend();
  $eventDurLegend = $eventDurLegend ? $eventDurLegend : '';
    
  my $yMax = $self->getDefaultYMax();
  my $yMin = $self->getDefaultYMin();
  my $hideXAxisLabels = $self->getHideXAxisLabels() ? 'TRUE' : 'FALSE';
    
  my $xMax = $self->getDefaultXMax();
  my $xMin = $self->getDefaultXMin();

  my $adjustXYScalesTogether = $self->getAdjustXYScalesTogether();
  $adjustXYScalesTogether = defined($adjustXYScalesTogether) ? $adjustXYScalesTogether : 'FALSE';

  my $antisenseFoldChange = $self->getAntisenseFoldChange();
  $antisenseFoldChange = defined($antisenseFoldChange) ? $antisenseFoldChange : 1;

  my $senseFoldChange = $self->getSenseFoldChange();
  $senseFoldChange = defined($senseFoldChange) ? $senseFoldChange : -1;

  my $yAxisFoldInductionFromM = $self->getMakeYAxisFoldInduction();
    
  my $df = $self->getSplineDF;
  my $pointsLast = $self->getArePointsLast();
  my $rPostscript = $self->getRPostscript();
    
  my $smoothLines = $self->getSmoothLines();
  my $smoothWithLoess = $self->getSmoothWithLoess();
    
  my $splineApproxN = $self->getSplineApproxN();
    
  my $prtcpnt_sum = $self->getPartName() eq 'prtcpnt_sum' ? 'TRUE' : 'FALSE';
  my $prtcpnt_timeline = $self->getTimeline() ? 'TRUE' : 'FALSE';
    
  my $colorVals = $self->getColorVals();
  $colorVals = $colorVals ? $colorVals : '';
  my $hasColorVals = $colorVals ? 'TRUE' : 'FALSE';


  my $colorLabels = $self->getColorLabels();
  $colorLabels = $colorLabels ? $colorLabels : '';
  my $hasColorLabels = $colorLabels ? 'TRUE' : 'FALSE';

  my $customBreaks = $self->getCustomBreaks();
  $customBreaks = $customBreaks ? $customBreaks : '';
  my $colorPointsOnly = $self->getColorPointsOnly() ? 'TRUE' : 'FALSE';

  my $fillVals = $self->getFillVals();
  $fillVals = $fillVals ? $fillVals : '';
  my $hasFillVals = $fillVals ? 'TRUE' : 'FALSE';

  my $fillLabels = $self->getFillLabels();
  $fillLabels = $fillLabels ? $fillLabels : '';
  my $hasFillLabels = $fillLabels ? 'TRUE' : 'FALSE';

  $yMax = $yMax ? $yMax : "-Inf";
  $yMin = defined($yMin) ? $yMin : "Inf";

  my $isThumbnail = "FALSE";

  if($self->getThumbnail()) {
    $isThumbnail = "TRUE";
  }

  my $isCompactString = "FALSE";

  if($self->isCompact()) {
    $yMax= "-Inf";
    $yMin = "Inf";

    $isCompactString = "TRUE";
  }

  my $coordCartesian = 'FALSE';
  if(defined($xMax) || defined($xMin)) {
    $coordCartesian = 'TRUE';
    if(!defined($xMax)) {
      $xMax = "-Inf";
    }
    if(!defined($xMin)){
      $xMin = "Inf";
    }
  } else {
    $xMax = "-Inf";
    $xMin = "Inf";
  }

  $pointsLast = $pointsLast ? 'TRUE' : 'FALSE';

  $smoothLines = $smoothLines ? 'TRUE' : 'FALSE'; 
  $smoothWithLoess = $smoothWithLoess ? 'TRUE' : 'FALSE'; 

  my $dfString;
  if($df) {
    $dfString = ", df=$df";
  }
  $df = defined($df) ? $dfString : "";

  $yAxisFoldInductionFromM = $yAxisFoldInductionFromM ? 'TRUE' : 'FALSE';

  my $forceNoLines = $self->getForceNoLines() ? 'TRUE' : 'FALSE';
  my $forceConnectPoints = $self->getForceConnectPoints() ? 'TRUE' : 'FALSE';
  my $varyGlyphByXAxis = $self->getVaryGlyphByXAxis() ? 'TRUE' : 'FALSE';
  my $isFilled = $self->getIsFilled() ? 'TRUE' : 'FALSE';

  $rAdjustProfile = $rAdjustProfile ? $rAdjustProfile : "";

  $rPostscript = $rPostscript ? $rPostscript : "";

  $splineApproxN = defined($splineApproxN) ? $splineApproxN : 60;

  my $bottomMargin = $self->getElementNameMarginSize();

  my $profileTypes = $self->getProfileTypes();
  my $profileTypesString = EbrcWebsiteCommon::View::GraphPackage::Util::rStringVectorFromArray($profileTypes, 'profile.types');

  my $facets = $self->getFacets();
  my $facetString = "DUMMY";
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

  my $facetNumCols = $self->getFacetNumCols();
  $facetNumCols = $facetNumCols ? $facetNumCols : 0;

  my $fillBelowLine = $self->getFillBelowLine() ? 'TRUE' : 'FALSE';
  my $removeNaN = $self->getRemoveNaN() ? 'TRUE' : 'FALSE';

  my $hasExtraLegend = $self->getHasExtraLegend() ? 'TRUE' : 'FALSE';
  my $extraLegendSize = $self->getExtraLegendSize();

  #my $horizontalLegend = $self->getHorizontalLegend() ? 'TRUE' : 'FALSE';

  my $hasMetaData = $self->getHasMetaData() ? 'TRUE' : 'FALSE';

  my $titleLine = $self->getTitleLine();

  my $scale = $self->getScalingFactor;

  my $legendLabels = $self->getLegendLabels;

  my $legendLabelsString = EbrcWebsiteCommon::View::GraphPackage::Util::rStringVectorFromArray($legendLabels, 'legend.label');


  my $hasLegendLabels = $legendLabelsString ? 'TRUE' : 'FALSE';
  my $rcode = "
# ---------------------------- LINE PLOT ----------------------------


$profileFiles
$elementNamesFiles
$colorsString
$pointsPchString
$sampleLabelsString
$stderrFiles
$legendLabelsString
$skipProfilesString
$profileTypesString


is.compact=$isCompactString;
is.thumbnail=$isThumbnail;

#-------------------------------------------------

if(length(profile.files) != length(element.names.files)) {
  stop(\"profile.files length not equal to element.names.files length\");
}


x.min = \"$xMin\";
x.max = \"$xMax\";

y.min = $yMin;
y.max = $yMax;  


profile.df.full = data.frame();

for(ii in 1:length(profile.files)) {
  skip.stderr = FALSE;

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

   if (!$prtcpnt_sum) {
      profile.df = aggregate(profile.df, list(profile.df\$ELEMENT_ORDER), mean, na.rm=T)
      if(length(profile.df\$ELEMENT_ORDER) != eo.count) {
        skip.stderr = TRUE;
      }
    }

    if (!is.null(legend.label)) {
      profile.df\$LEGEND = legend.label[ii];
    }
    profile.df\$PROFILE_FILE = profile.files[ii];
    profile.df\$PROFILE_TYPE = profile.types[ii];
  }

  if (element.names.files[ii] != \"\") {
    element.names.df = read.table(element.names.files[ii], header=T, sep=\"\\t\");

    if(length(profile.df\$ELEMENT_ORDER) > length(element.names.df\$ELEMENT_ORDER)) {
      message(paste(\"Warning: profile file \", profile.files[ii], \" contains more rows than element names file\", element.names.files[ii], \". Additional entries will be ignored.\"));
    } else if(length(element.names.df\$ELEMENT_ORDER) > length(profile.df\$ELEMENT_ORDER)) {
      message(paste(\"Warning: element names file \", element.names.files[ii], \" contains more rows than profile file\", profile.files[ii], \". Additional entries will be ignored.\"));
    }

    profile.df = merge(profile.df, element.names.df, by = \"ELEMENT_ORDER\");

    if (\"FACET\" %in% colnames(element.names.df)){
      profile.df\$FACET <- as.character(profile.df\$FACET)
      profile.df\$FACET[is.na(profile.df\$FACET)] <- \"Unknown\"
      profile.df\$FACET[profile.df\$FACET == \"\"] <- \"Unknown\"
      profile.df\$FACET = as.factor(profile.df\$FACET)
    }
  }

  profile.df\$ELEMENT_NAMES = as.character(profile.df\$NAME);
  element.names.numeric = as.numeric(gsub(\" *[a-z-A-Z()+-]+ *\", \"\", profile.df\$NAME, perl=T));
  profile.df\$ELEMENT_NAMES_NUMERIC = element.names.numeric;


  if(!skip.stderr && !is.na(stderr.files[ii]) && stderr.files[ii] != '') {
    stderr.tmp = read.table(stderr.files[ii], header=T, sep=\"\\t\");
    profile.df\$STDERR = stderr.tmp\$VALUE;
  }
  else {
    profile.df\$STDERR = NA;
  }

  profile.df = profile.df[, !(names(profile.df) %in% \"NAME\")];

  profile.df.full = rbind.fill(profile.df.full, profile.df);
}

#if no y values, make a placeholder (ex: timelines)
if (!\"VALUE\" %in% colnames(profile.df.full)) {
  profile.df.full\$VALUE = NA
}

#allow adjustments
$rAdjustProfile

if ($prtcpnt_sum) {
  if (\"STATUS\" %in% colnames(profile.df.full)) {
    status.df = completeDF(profile.df.full, \"STATUS\");
  }
  if (\"DURATION\" %in% colnames(profile.df.full)) {
    annotate.df = completeDF(profile.df.full, \"DURATION\");
  }
  if (any(grepl(\"WHO Standards\", unique(profile.df.full\$LEGEND)))){
     generic.df = completeDF(profile.df.full, \"VALUE\")

     who.df = generic.df[grepl(\"WHO Standards\", generic.df\$LEGEND),]

     profile.df.clean = generic.df[!(grepl(\"WHO Standards\", generic.df\$LEGEND)),]
     
  }else{

     profile.df.clean = completeDF(profile.df.full, \"VALUE\");
  }

}

if(\"FACET\" %in% colnames(profile.df.full)) {
  profile.df.full\$FACET_ns=factor(profile.df.full\$FACET,levels=mixedsort(levels(profile.df.full\$FACET)));
}
if (!exists(\"profile.is.numeric\")) {
  profile.is.numeric = sum(!is.na(profile.df.full\$ELEMENT_NAMES_NUMERIC)) == nrow(profile.df.full);
}

#will need to look again at this if ever dates come in with a different format than R's default.
profile.is.date = all(!is.na(as.Date(as.character(profile.df.full\$ELEMENT_NAMES), format='%Y-%m-%d')));

coord.cartesian = $coordCartesian
if($removeNaN){
  if(profile.is.numeric) {
    x.max = max(profile.df.full\$ELEMENT_NAMES_NUMERIC);
    x.min = min(profile.df.full\$ELEMENT_NAMES_NUMERIC);
    profile.df.full = completeDF(profile.df.full, \"VALUE\");
    coord.cartesian = TRUE;
  } else {
    profile.df.full = completeDF(profile.df.full, \"VALUE\");
  }
}

if (!all(is.na(profile.df.full\$VALUE))) {
  if ($prtcpnt_sum) {
    profile.df.full = profile.df.clean;
  }
}

if(\"CONTXAXIS\" %in% colnames(profile.df.full) && !all(is.na(profile.df.full\$CONTXAXIS))){
  myX <- \"CONTXAXIS\"
} else if (profile.is.numeric) {
  myX <- \"ELEMENT_NAMES_NUMERIC\"
} else {
  myX <- \"ELEMENT_NAMES\"
}

hideLegend = FALSE
if (is.null(profile.df.full\$LEGEND)) {
  profile.df.full\$LEGEND <- profile.df.full\$PROFILE_FILE
  hideLegend = TRUE
}

gp = ggplot(profile.df.full, aes(x=get(myX), y=VALUE, group=PROFILE_FILE, color=LEGEND))

if ($prtcpnt_sum) {
  if (all(is.na(profile.df.full\$VALUE))) {
    #this for the case where no real y values are to be plotted (ex: timelines)
    y.max = 2;
    y.min = 0;
    y.scale = 1;
  } else {
     #may have to change this from determining scale, to determine the order of magnitude of the scale
     #ex. instead of finding diff between max and min, find number of places (10s, 100s etc)
     y.max = max(y.max, max(profile.df.full\$VALUE, na.rm=T), na.rm=TRUE) + 1;
     y.temp = min(y.min, min(profile.df.full\$VALUE, na.rm=T), na.rm=TRUE);
     y.scale = abs(round((y.max - y.temp) / 3));
     if (y.scale < 1) {
       y.scale = 1;
     }
   y.min = y.temp - (2.25 * y.scale);
 }
} else {
  y.max = max(y.max, max(profile.df.full\$VALUE, na.rm=TRUE), na.rm=TRUE);
  y.min = min(y.min, min(profile.df.full\$VALUE, na.rm=TRUE), na.rm=TRUE);
}

if ($adjustXYScalesTogether) {
   x.max = max(as.numeric(x.max), max(profile.df.full\$CONTXAXIS, na.rm=TRUE), na.rm=TRUE);
   x.min = min(as.numeric(x.min), min(profile.df.full\$CONTXAXIS, na.rm=TRUE), na.rm=TRUE);
   maxValue <- max(c(abs(y.max),abs(y.min),abs(x.max),abs(x.min)));
   y.max=x.max=maxValue;
   y.min=x.min=-1*maxValue;
   if ($antisenseFoldChange>0) {y.end=y.max}
   else {y.end=y.min}
   if ($senseFoldChange>0) {x.end=x.max}
   else {x.end=x.min}
   gp = gp + geom_segment(aes(x=$senseFoldChange,y=$antisenseFoldChange,xend=$senseFoldChange,yend=y.end),linetype=\"dashed\",color=\"red\");
   gp = gp + geom_segment(aes(x=$senseFoldChange,y=$antisenseFoldChange,xend=x.end,yend=$antisenseFoldChange),linetype=\"dashed\",color=\"red\");
   gp = gp + geom_abline(intercept=0,slope=1,linetype=\"dashed\",color=\"red\");
}


if($isSVG) {
  useTooltips=TRUE;
}else{
  useTooltips=FALSE;
}

if (!$prtcpnt_timeline) {

if(useTooltips){
  if (\"TOOLTIP\" %in% colnames(profile.df.full)) {
    gp = gp + geom_tooltip(aes(tooltip=TOOLTIP), real.geom=geom_point);
  } else {
    if (myX == \"CONTXAXIS\") {
      gp = gp + geom_tooltip(aes(tooltip=paste0(\"x: \",get(myX), \", y: \", VALUE, \"|Sample: \", ELEMENT_NAMES)), real.geom=geom_point);
    } else {
      if (\"SIZE\" %in% colnames(profile.df.full)) {
        gp = gp + geom_tooltip(aes(tooltip=paste0(\"x: \", get(myX), \", y: \", VALUE), size=SIZE), real.geom=geom_point);
        gp = gp + scale_size_manual(values=seq(length(unique(profile.df.full\$SIZE))), breaks=unique(profile.df.full\$SIZE), labels=unique(profile.df.full\$SIZE))
      } else {
        gp = gp + geom_tooltip(aes(tooltip=paste0(\"x: \",get(myX), \", y: \", VALUE)), real.geom=geom_point);  
      }
    }
  }
}else{
  gp = gp + geom_point();
}

if (!$hasColorVals) {
  if (\"GROUP\" %in% colnames(profile.df.full)) {
    count = length(unique(profile.df.full\$GROUP));
    if (count < length($colorsStringNotNamed)) {
      stop(\"Too many colors provided. Please only provide the same number of colors as groups.\");
    }
  } else {
   if (!is.null(profile.df.full\$LEGEND) && !$prtcpnt_sum) {
    count = length(unique(profile.df.full\$LEGEND));
   } else {
    count = $numProfiles;
   }
    if (count < length($colorsStringNotNamed)) {
      stop(\"Too many colors provided. Please only provide the same number of colors as profile files.\");
    }
  }
}

if(!$forceNoLines) {
  #override earlier group setting if group column exists
  if (\"GROUP\" %in% colnames(profile.df.full)) {
    if (!hideLegend && useTooltips && !any(grepl(\".tab\", profile.df.full\$LEGEND, fixed=TRUE))) {
      if ($colorPointsOnly) {
        gp = gp + aes(group=GROUP)
        gp = gp + geom_tooltip(aes(tooltip=LEGEND), real.geom=geom_line, color=\"black\")
      } else {
        gp = gp + aes(group=GROUP)
        gp = gp + geom_tooltip(aes(tooltip=LEGEND), real.geom=geom_line);
      }
    } else {
      if ($colorPointsOnly) {
        gp = gp + aes(group=GROUP)
        gp = gp + geom_line(color=\"black\")
      } else {
        gp = gp + aes(group=GROUP)
        gp = gp + geom_line();
      }
    }
  } else {
    if (!hideLegend && useTooltips && !any(grepl(\".tab\", profile.df.full\$LEGEND, fixed=TRUE))) {
      if ($colorPointsOnly) {
        gp = gp + geom_tooltip(aes(tooltip=LEGEND), real.geom=geom_line, color=\"black\")
      } else {
         
        gp = gp + geom_tooltip(aes(tooltip=LEGEND),real.geom=geom_line)     

      }
    } else {
      if ($colorPointsOnly) {
        gp = gp + geom_line(color=\"black\")
      } else {
        gp = gp + geom_line();
      }
    }
  }
  if($fillBelowLine) {
    if(length(unique(profile.df.full\$LEGEND)) > 1) {
      gp = gp + geom_tooltip(aes(fill=LEGEND, tooltip=LEGEND, group=LEGEND), position=\"identity\", real.geom=geom_area) + scale_fill_manual(values=rep($colorsStringNotNamed, count/length($colorsStringNotNamed)));
    } else {
      gp = gp + geom_area(aes(fill=LEGEND, group=LEGEND), position=\"identity\") + scale_fill_manual(values=rep($colorsStringNotNamed, count/length($colorsStringNotNamed)));
    }
  }

  if($smoothLines) {
    if(profile.is.numeric && nrow(profile.df.full) > 10) {
      if(length(levels(factor(profile.df.full\$PROFILE_FILE))) == 1) {
        gp = gp + geom_smooth(method=\"loess\");
      }
      if(length(levels(factor(profile.df.full\$PROFILE_FILE))) > 1) {
         gp = gp + geom_smooth(method=\"loess\", se=FALSE);
      }
    } else {
      df2smooth = completeDF(profile.df.full, \"ELEMENT_NAMES_NUMERIC\");
      gp = gp + geom_smooth(data = df2smooth, method=\"loess\", se=FALSE, colour = \"black\", size = .5);
    }
  }
}

if (coord.cartesian) {
  if (!is.na(as.Date(as.character(x.max), format='%Y-%m-%d'))) {
    gp = gp + scale_x_date(limits=c(as.Date(x.min),as.Date(x.max)));
  } else {
    gp = gp + coord_cartesian(xlim=c(as.numeric(x.min),as.numeric(x.max)));
  }
}

# TODO actually fix this by setting count in perl rather than R, or figure something else out. 
# then wont need the if statement. cause though fine now, this still may eventually cause problems.
if ($hasColorVals) {
   gp = gp + scale_color_manual(values = $colorVals)
} else {
  if (count/length($colorsStringNotNamed) == 1) {
    gp = gp + scale_colour_manual(values=$colorsStringNotNamed, breaks=profile.df.full\$LEGEND, labels=profile.df.full\$LEGEND, name=\"Legend\");
  } else {
    gp = gp + scale_colour_manual(values=rep($colorsStringNotNamed, count/length($colorsStringNotNamed)), breaks=profile.df.full\$LEGEND, labels=profile.df.full\$LEGEND, name=\"Legend\");
  }
}




if( $fillBelowLine) {
  hideLegend=TRUE;
}

xAxisCount = length(profile.df.full\$ELEMENT_NAMES);

if(is.compact) {
  gp = gp + theme_void() + theme(legend.position=\"none\");
} else if(is.thumbnail) {
  gp = gp + theme_bw();
  
  if ($adjustXYScalesTogether) {
     gp = gp + labs(title=\"$plotTitle\", y=\"$yAxisLabel\", x=\"$xAxisLabel\");
  } else {
     gp = gp + labs(title=\"$plotTitle\", y=\"$yAxisLabel\", x=NULL);
  }

  gp = gp + ylim(y.min, y.max);

  if(!profile.is.numeric) {
    gp = gp + scale_x_discrete(label=function(x) customAbbreviate(x));
    if(xAxisCount > 3) {
      gp = gp + theme(axis.text.x  = element_text(angle=45, vjust=1, hjust=1, size=12), plot.title = element_text(colour=\"#b30000\"));
    } else {
      gp = gp + theme(axis.text.x  = element_text(angle=90,vjust=0.5, size=12), plot.title = element_text(colour=\"#b30000\"));
    }
  } else {
    gp = gp + theme(axis.text.x  = element_text(angle=90,vjust=0.5, size=12), plot.title = element_text(colour=\"#b30000\"));
  }
  gp = gp + theme(legend.position=\"none\");
} else {
  gp = gp + theme_bw();
  gp = gp + labs(title=\"$plotTitle\", y=\"$yAxisLabel\", x=\"$xAxisLabel\");
  gp = gp + ylim(y.min, y.max);
  gp = gp + theme(plot.title = element_text(colour=\"#b30000\"));

  if (myX == \"CONTXAXIS\") {
    if (all(is.na(as.numeric(gsub(\" *[a-z-A-Z()+-]+ *\", \"\", profile.df.full[[myX]], perl=T))))) {
      gp = gp + theme(axis.text.x = element_blank());    
    }
  } else {
    if(!profile.is.numeric) {
      gp = gp + scale_x_discrete(label=function(x) customAbbreviate(x));
      if (xAxisCount > 50) {
        gp = gp + theme(axis.text.x = element_blank())
      } else if(xAxisCount > 3) {
        gp = gp + theme(axis.text.x  = element_text(angle=45, vjust=1, hjust=1, size=12), plot.title = element_text(colour=\"#b30000\"));
      } else {
        gp = gp + theme(axis.text.x  = element_text(angle=90,vjust=0.5, size=12), plot.title = element_text(colour=\"#b30000\"));
      }
    }
  }

  if(hideLegend) {
    gp = gp + theme(legend.position=\"none\");
  #} else if(\$horizontalLegend) {
  #  gp = gp + theme(legend.position=\"bottom\");
  } 

}

if(\"FACET\" %in% colnames(profile.df.full)) {
  if(!all(profile.df.full\$FACET_ns == \"Unknown\")){
    numLevels=nlevels(profile.df.full\$FACET_ns);
    if ($facetNumCols != 0) {
      numCols = $facetNumCols
    } else {
      numCols=ceiling(numLevels / 2);
    }
    if (numLevels > 3) {
      gp = gp + facet_wrap( ~ FACET_ns, ncol=numCols);
    } else {
      gp = gp + facet_grid(. ~ FACET_ns);
    }
  }
}else if($hasFacets) {
  gp = gp + facet_grid($facetString);
}

if($hideXAxisLabels) {                                                                                                                                                                                      
    gp = gp + theme(axis.text.x = element_blank(), axis.ticks.x = element_blank());
}

}

if ($prtcpnt_sum) {

  if (\"YLABEL\" %in% colnames(profile.df.full)) {
    if (length(unique(profile.df.full\$YLABEL)) > 1 & all(grepl(\"z-score\", unique(profile.df.full\$YLABEL)))) {
      myYLab <- \"Z-score\" 
    } else {
      myYLab <- unique(profile.df.full\$YLABEL)[1]
    }
  } else {
    myYLab <- \"$yAxisLabel\"
  }

  if (\"XLABEL\" %in% colnames(profile.df.full)) {
    if (length(unique(profile.df.full\$XLABEL)) > 1) {
      myXLab <- \"$xAxisLabel\"
    } else {
      myXLab <- unique(profile.df.full\$XLABEL)[1]
    }
  } else {
    myXLab <- \"$xAxisLabel\"
  }


  if (grepl(\"z-score\", myYLab) | grepl(\"Z-score\", myYLab)) {
    gp = gp + geom_hline(aes(yintercept=2, linetype = as.factor(1)), colour = \"red\");
    gp = gp + geom_hline(aes(yintercept=-2, linetype = as.factor(1)), colour = \"red\");  
 
    gp = gp + scale_linetype_manual(name=\"Red Lines\", values = c(1), labels = c(\"+/- 2 SD\"))
  }


  event.start = exists(\"annotate.df\") && nrow(annotate.df) > 0;
  if (event.start) {

    #this to appease ggplot. otherwise wont plot a single point
    if (annotate.df\$START_DATE == annotate.df\$END_DATE) {
      annotate.df\$END_DATE = annotate.df\$END_DATE + 1;
    }
 
    #this to remove consecutive rows, only need start date and duration
    annotate.df\$DIFF <- c(0, abs(diff(annotate.df\$START_DATE)) == 1)
    annotate.df <- annotate.df[annotate.df\$DIFF == 0,]

    annotate.df\$TOOLTIP <- paste0(\"Start: \", annotate.df\$START_DATE, \"|Duration: \", annotate.df\$DURATION)
    annotate.df\$TOOLTIP[is.na(annotate.df\$DURATION)] <- NA
    gp = gp + geom_tooltip(data = annotate.df, aes(x = START_DATE, y = min(profile.df.clean\$VALUE) - y.scale, xend = END_DATE, yend = min(profile.df.clean\$VALUE) - y.scale, tooltip = TOOLTIP, size = as.factor(7)), real.geom = geom_segment)

    #custom legend
    gp = gp + scale_size_manual(name = \"Bars\", values = c(7), labels = c(\"$eventDurLegend\"))
    if ($hasColorVals) {
      colorVector <- $colorVals
      gp = gp + guides(size = guide_legend(override.aes = list(color = c(unname(colorVector[names(colorVector) == unique(annotate.df\$LEGEND)[1]])))))
    } else {
      gp = gp + guides(size = guide_legend(override.aes = list(color = c(the.colors[length(the.colors)]))))
    }
  }


  who_standards = exists(\"who.df\") && nrow(who.df)>0;


  if (who_standards){
   
     gp = gp + geom_tooltip(data=who.df,aes(x=get(myX), y=VALUE, tooltip=LEGEND),real.geom = geom_line)
   
   }


  status = exists(\"status.df\") && nrow(status.df) > 0;

  if (status) {

    if ($prtcpnt_timeline) {

      gp = gp + geom_tooltip(data = status.df, aes(x = ELEMENT_NAMES, y = 1, tooltip = TOOLTIP, color = COLOR, fill = FILL), size = 4, shape = 21, real.geom = geom_point)

      gp = gp + scale_color_manual(name=\"Border\", breaks = $customBreaks, values=$colorVals)
      gp = gp + scale_fill_manual(name=\"Center\", breaks = $customBreaks, na.value = NA, values = $fillVals)

      if (coord.cartesian) {
        gp = gp + scale_x_date(limits=c(as.Date(x.min),as.Date(x.max)));
      }
      gp = gp + theme_bw();
      if (is.thumbnail) {
        gp = gp + labs(title=NULL, x=NULL, y=NULL);
        gp = gp + theme(legend.position = \"none\")
      } else {
        gp = gp + labs(title=\"$plotTitle\", x=myXLab, y=NULL);
        gp = gp + guides(fill = guide_legend(override.aes = list(color =\"white\" )))
        gp = gp + theme(legend.position=\"bottom\"); 
      }
      gp = gp + ylim(y.min, y.max);
      gp = gp + theme(plot.title = element_text(colour=\"#b30000\"));

    } else {
      status.df = transform(status.df, \"COLOR\"=ifelse(grepl(\"\\\\|\", STATUS), \"black\", as.character(STATUS)));
      status.df\$COLOR = as.character(status.df\$COLOR)
      numColors = length(unique(status.df\$COLOR))
      if (numColors > 1) {
        myColors = rainbow(numColors);
      } else {
        myColors = \"cyan\";
      }
      status.df\$TOOLTIP <- paste0(\"Day: \", status.df\$ELEMENT_NAMES_NUMERIC, \"|Status: \", status.df\$STATUS)
      status.df\$TOOLTIP[is.na(status.df\$STATUS)] <- NA      
      gp = gp + geom_tooltip(data = status.df, aes(x = ELEMENT_NAMES_NUMERIC, y = min(profile.df.clean\$VALUE) - (2 * y.scale), tooltip = TOOLTIP, color=COLOR, shape=as.factor(16)), real.geom = geom_point);

      if ($hasColorVals) {
        gp = gp + scale_colour_manual(values=$colorVals, breaks = $customBreaks, name=\"Legend\");
      } else {
        gp = gp + scale_colour_manual(values=c($colorsStringNotNamed, myColors), breaks=c(profile.df.full\$PROFILE_FILE, status.df\$COLOR), labels=c(as.character(profile.df.full\$LEGEND), as.character(status.df\$COLOR)), name=\"Legend\");
      }

      #create custom legend
      gp = gp + scale_shape_manual(name=\"Points\", values=c(16), labels = c(\"$statusLegend\"));
    }
  }

    if (!$prtcpnt_timeline) {
      if (is.thumbnail) {
        gp = gp + labs(title=NULL, x=myXLab, y=myYLab, subtitle=\"$subtitle\");
        gp = gp + theme(plot.subtitle=element_text(size=12, color=\"black\"));
      } else {
        gp = gp + labs(title=\"$plotTitle\", x=myXLab, y=myYLab, subtitle=\"$subtitle\");
        gp = gp + theme(plot.subtitle=element_text(size=12, color=\"black\"));
      }
    }

    gp = gp + guides(color = guide_legend(order=1));

}


#postscript
$rPostscript

plotlist[[plotlist.i]] = gp;
plotlist.i = plotlist.i + 1;


";
  return $rcode;
}

1;

#--------------------------------------------------------------------------------

package EbrcWebsiteCommon::View::GraphPackage::GGLinePlot::ParticipantSummary;
use base qw( EbrcWebsiteCommon::View::GraphPackage::GGLinePlot );
use strict;

sub new {
  my $class = shift;
  my $self = $class->SUPER::new(@_);
  my $id = $self->getId();

  $self->setPartName('prtcpnt_sum');
  $self->setPlotTitle("Participant Observations Summary - $id");
  my $xmax = $self->getDefaultXMax() ? $self->getDefaultXMax() : 745;
  $self->setDefaultXMax($xmax);
  my $xmin = $self->getDefaultXMin() ? $self->getDefaultXMin() : 0;
  $self->setDefaultXMin($xmin);
  $self->setDefaultYMin(100);
 
  return $self;

}
1;


#--------------------------------------------------------------------------------

package EbrcWebsiteCommon::View::GraphPackage::GGLinePlot::Percentile;
use base qw( EbrcWebsiteCommon::View::GraphPackage::GGLinePlot );
use strict;

sub new {
  my $class = shift;
  my $self = $class->SUPER::new(@_);
  my $id = $self->getId();

   $self->setPartName('percentile');
   $self->setDefaultYMax(100);
   $self->setDefaultYMin(0);
   $self->setYaxisLabel('Percentile');
   $self->setPlotTitle("Percentile - $id");

   $self->setIsLogged(0);

   return $self;
}
1;

#--------------------------------------------------------------------------------

package EbrcWebsiteCommon::View::GraphPackage::GGLinePlot::LogRatio;
use base qw( EbrcWebsiteCommon::View::GraphPackage::GGLinePlot );
use strict;

sub new {
  my $class = shift;
  my $self = $class->SUPER::new(@_);
  my $id = $self->getId();

   $self->setDefaultYMax(2);
   $self->setDefaultYMin(-2);

   $self->setPartName('exprn_val');
   $self->setYaxisLabel("Expression Value (log2 ratio)");

   $self->setPlotTitle("Log(ratio) - $id");

   $self->setMakeYAxisFoldInduction(1);
   $self->setIsLogged(1);

   return $self;
}

1;

#--------------------------------------------------------------------------------

package EbrcWebsiteCommon::View::GraphPackage::GGLinePlot::RMA;
use base qw( EbrcWebsiteCommon::View::GraphPackage::GGLinePlot );
use strict;

sub new {
  my $class = shift;
  my $self = $class->SUPER::new(@_);
  my $id = $self->getId();

  my $wantLogged = $self->getWantLogged();

  $self->setYaxisLabel("RMA Value (log2)");
  $self->setPlotTitle("RMA Expression Value - $id");
  $self->setIsLogged(1);

  # RMAExpress is log2
  if(defined($wantLogged) && $wantLogged eq '0') {
    $self->setAdjustProfile('lines.df = 2^(lines.df);points.df = 2^(points.df);stderr.df = 2^(stderr.df);');
    $self->setYaxisLabel("RMA Value");
  }

  $self->setDefaultYMax(4);
  $self->setDefaultYMin(0);

  $self->setPartName('rma');

  return $self;
}

1;

#--------------------------------------------------------------------------------

package EbrcWebsiteCommon::View::GraphPackage::GGLinePlot::Filled;
use base qw( EbrcWebsiteCommon::View::GraphPackage::GGLinePlot );
use strict;

sub new {
  my $class = shift;
  my $self = $class->SUPER::new(@_);
  my $id = $self->getId();

  $self->setDefaultYMin(0);
  $self->setPartName('filled');

  $self->setIsFilled(1);
  
  return $self;
}

#--------------------------------------------------------------------------------

package EbrcWebsiteCommon::View::GraphPackage::GGLinePlot::RNASeq;
use base qw( EbrcWebsiteCommon::View::GraphPackage::GGLinePlot );
use strict;

sub new {
  my $class = shift;
  my $self = $class->SUPER::new(@_);
  my $id = $self->getId();

  $self->setPartName('fpkm');
  $self->setYaxisLabel('FPKM');
  $self->setPlotTitle("FPKM - $id");
  $self->setDefaultYMin(0);
  $self->setDefaultYMax(20);

  my $wantLogged = $self->getWantLogged();
  if(defined($wantLogged) && $wantLogged eq '1') {
    $self->addAdjustProfile('profile.df.full$VALUE <- log2(profile.df.full$VALUE + 1);');
    $self->setYaxisLabel("FPKM (log2)");
    $self->setDefaultYMax(4);
    $self->setIsLogged(1);
  }

  $self->setPointsPch(['NA']);

  $self->setSmoothLines(1);
  $self->setIsFilled(1);
  
  return $self;
}

#--------------------------------------------------------------------------------

package EbrcWebsiteCommon::View::GraphPackage::GGLinePlot::PairedEndRNASeq;
use base qw( EbrcWebsiteCommon::View::GraphPackage::GGLinePlot::RNASeq );
use strict;

sub new {
  my $class = shift;
  my $self = $class->SUPER::new(@_);
  my $id = $self->getId();

  $self->setPartName('fpkm');
  $self->setYaxisLabel('FPKM');
  $self->setPlotTitle("FPKM - $id");

  return $self;
}


#--------------------------------------------------------------------------------

package EbrcWebsiteCommon::View::GraphPackage::GGLinePlot::QuantileNormalized;
use base qw( EbrcWebsiteCommon::View::GraphPackage::GGLinePlot );
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

#--------------------------------------------------------------------------------

package EbrcWebsiteCommon::View::GraphPackage::GGLinePlot::MRNADecay;
use base qw( EbrcWebsiteCommon::View::GraphPackage::GGLinePlot );
use strict;

sub new {
  my $class = shift; 
   my $self = $class->SUPER::new(@_);

   my $id = $self->getId();

   $self->setDefaultYMax(4);
   $self->setDefaultYMin(0);
   $self->setYaxisLabel('Expression Values');

   $self->setPartName('exprn_val');
   $self->setPlotTitle("Expression Values - $id");

   $self->setMakeYAxisFoldInduction(0);
   $self->setIsLogged(0);

   return $self;
}

#--------------------------------------------------------------------------------

package EbrcWebsiteCommon::View::GraphPackage::GGLinePlot::QuantMassSpec;
use base qw( EbrcWebsiteCommon::View::GraphPackage::GGLinePlot );
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

#--------------------------------------------------------------------------------

package EbrcWebsiteCommon::View::GraphPackage::GGLinePlot::QuantMassSpecNonRatio;
use base qw( EbrcWebsiteCommon::View::GraphPackage::GGLinePlot );
use strict;

sub new {
  my $class = shift; 
   my $self = $class->SUPER::new(@_);

   my $id = $self->getId();

   $self->setDefaultYMax(10);
   $self->setDefaultYMin(0);
   $self->setYaxisLabel('Abundance (log2)');

   $self->setPartName('exprn_val');
   $self->setPlotTitle("Quant Mass Spec Profile - $id");

   return $self;
}

#--------------------------------------------------------------------------------

package EbrcWebsiteCommon::View::GraphPackage::GGLinePlot::QuantMassSpecNonRatioUnlogged;
use base qw( EbrcWebsiteCommon::View::GraphPackage::GGLinePlot );
use strict;

sub new {
  my $class = shift; 
   my $self = $class->SUPER::new(@_);

   my $id = $self->getId();

   $self->setDefaultYMax(10);
   $self->setDefaultYMin(0);
   $self->setYaxisLabel('Abundance');

   $self->setPartName('exprn_val');
   $self->setPlotTitle("Quant Mass Spec Profile - $id");

   return $self;
}

1;
