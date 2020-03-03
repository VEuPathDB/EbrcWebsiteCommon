package EbrcWebsiteCommon::View::GraphPackage::LinePlot;

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

sub getXaxisLabel                { $_[0]->{'_x_axis_label'                  }}
sub setXaxisLabel                { $_[0]->{'_x_axis_label'                  } = $_[1]}

sub getArePointsLast             { $_[0]->{'_are_points_last'               }}
sub setArePointsLast             { $_[0]->{'_are_points_last'               } = $_[1]}

sub getSmoothLines               { $_[0]->{'_smooth_lines'                  }}
sub setSmoothLines               { $_[0]->{'_smooth_lines'                  } = $_[1]}


sub getSmoothWithLoess           { $_[0]->{'_smooth_with_loess'                  }}
sub setSmoothWithLoess           { $_[0]->{'_smooth_with_loess'                  } = $_[1]}


sub getSplineApproxN             { $_[0]->{'_spline_approx_n'               }}
sub setSplineApproxN             { $_[0]->{'_spline_approx_n'               } = $_[1]}

sub getSplineDF                  { $_[0]->{'_spline_degrees_of_freedom'     }}
sub setSplineDF                  { $_[0]->{'_spline_degrees_of_freedom'     } = $_[1]}

sub getHasMetaData              { $_[0]->{'_has_meta_data'                 }}
sub setHasMetaData              { $_[0]->{'_has_meta_data'                 } = $_[1]}


sub getForceConnectPoints              { $_[0]->{'_force_connect_points'                 }}
sub setForceConnectPoints              { $_[0]->{'_force_connect_points'                 } = $_[1]}



#--------------------------------------------------------------------------------

sub new {
  my $class = shift;

   my $self = $class->SUPER::new(@_);

   $self->setXaxisLabel("Whoops! Object forgot to call setXaxisLabel");
   $self->setDefaultYMax(2);
   $self->setDefaultYMin(-2);
   return $self;
}

#--------------------------------------------------------------------------------

sub makeRPlotString {
  my ($self, $idType) = @_;

  my $sampleLabels = $self->getSampleLabels();

  my $sampleLabelsString = EbrcWebsiteCommon::View::GraphPackage::Util::rStringVectorFromArray($sampleLabels, 'x.axis.label');

  my $overrideXAxisLabels = scalar @$sampleLabels > 0 ? "TRUE" : "FALSE";

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
      next;
    }

    $skipProfileSets[$i] = "FALSE";
  }

  if(scalar @$profileSets == $skipped) {
    return $blankGraph;
  }

  my $skipProfilesString = EbrcWebsiteCommon::View::GraphPackage::Util::rBooleanVectorFromArray(\@skipProfileSets, 'skip.profiles');
  my $colorsString = EbrcWebsiteCommon::View::GraphPackage::Util::rStringVectorFromArray($colors, 'the.colors');
  my $pointsPchString = EbrcWebsiteCommon::View::GraphPackage::Util::rNumericVectorFromArray($pointsPch, 'points.pch');

  
  my $rAdjustProfile = $self->getAdjustProfile();
  my $yAxisLabel = $self->getYaxisLabel();
  my $xAxisLabel = $self->getXaxisLabel();
  my $plotTitle = $self->getPlotTitle();

  my $yMax = $self->getDefaultYMax();
  my $yMin = $self->getDefaultYMin();

  my $xMax = $self->getDefaultXMax();
  my $xMin = $self->getDefaultXMin();

  my $yAxisFoldInductionFromM = $self->getMakeYAxisFoldInduction();
  
  my $df = $self->getSplineDF;
  my $pointsLast = $self->getArePointsLast();
  my $rPostscript = $self->getRPostscript();

  my $smoothLines = $self->getSmoothLines();
  my $smoothWithLoess = $self->getSmoothWithLoess();

  my $splineApproxN = $self->getSplineApproxN();

  $yMax = $yMax ? $yMax : "-Inf";
  $yMin = defined($yMin) ? $yMin : "Inf";

  my $isCompactString = "FALSE";

  if($self->isCompact()) {
    $yMax= "-Inf";
    $yMin = "Inf";

    $isCompactString = "TRUE";
  }

  $xMax = $xMax ? $xMax : "-Inf";
  $xMin = defined($xMin) ? $xMin : "Inf";

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

  my $hasExtraLegend = $self->getHasExtraLegend() ? 'TRUE' : 'FALSE';
  my $extraLegendSize = $self->getExtraLegendSize();

  my $hasMetaData = $self->getHasMetaData() ? 'TRUE' : 'FALSE';

  my $titleLine = $self->getTitleLine();

  my $scale = $self->getScalingFactor;

  my $legendLabels = $self->getLegendLabels;
  my $legendLabelsString = ""; 
  if ($self->getHasExtraLegend ) {
      $legendLabelsString = EbrcWebsiteCommon::View::GraphPackage::Util::rStringVectorFromArray($legendLabels, 'legend.label')
    }
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

is.compact=$isCompactString;

#-------------------------------------------------

if(length(profile.files) != length(element.names.files)) {
  stop(\"profile.files length not equal to element.names.files length\");
}

x.min = $xMin;
x.max = $xMax;

y.min = $yMin;
y.max = $yMax;  

# Create Data Frames to collect values to be plotted
lines.df = as.data.frame(matrix(nrow=length(profile.files)));
lines.df\$V1 = NULL;

points.df = as.data.frame(matrix(nrow=length(profile.files)));
points.df\$V1 = NULL;

stderr.df = as.data.frame(matrix(nrow=length(profile.files)));
stderr.df\$V1 = NULL;

for(ii in 1:length(profile.files)) {
  skip.stderr = FALSE;

  if(skip.profiles[ii]) {
    next;
  };

  profile.df = read.table(profile.files[ii], header=T, sep=\"\\t\");

  if(!is.null(profile.df\$ELEMENT_ORDER)) {
    eo.count = length(profile.df\$ELEMENT_ORDER);
    if(!is.numeric(profile.df\$ELEMENT_ORDER)) {
      stop(\"Element order must be numeric for aggregation\");
    }
    profile.df = aggregate(profile.df, list(profile.df\$ELEMENT_ORDER), mean, na.rm=T)
    if(length(profile.df\$ELEMENT_ORDER) != eo.count) {
      skip.stderr = TRUE;
    }

  }

  profile = profile.df\$VALUE;

  element.names.df = read.table(element.names.files[ii], header=T, sep=\"\\t\");
  element.names = as.character(element.names.df\$NAME);


  element.names.numeric = as.numeric(gsub(\" *[a-z-A-Z()+-]+ *\", \"\", element.names, perl=T));
  is.numeric.element.names = !is.na(element.names.numeric);


  if($forceNoLines) {
    element.names.numeric = NA;
    is.numeric.element.names = is.numeric.element.names == 'BANANAS';
  }

   if(!skip.stderr && !is.na(stderr.files[ii]) && stderr.files[ii] != '') {
     stderr.tmp = read.table(stderr.files[ii], header=T, sep=\"\\t\");

    stderr = stderr.tmp\$VALUE;
   } else {
     stderr = element.names;
     stderr = NA;
   }

  for(j in 1:length(element.names)) {
    this.name = element.names[j];
    this.name.numeric = as.character(element.names.numeric[j]);

    if(!is.na(this.name.numeric)) {
      this.name = this.name.numeric;
    }

    if(is.null(.subset2(points.df, this.name, exact=TRUE))) {
      points.df[[this.name]] = NA;
    }

    if(is.null(.subset2(lines.df, this.name, exact=TRUE))) {
      lines.df[[this.name]] = NA;
    }

    if(is.numeric.element.names[j]) {
      lines.df[[this.name]][ii] = profile[j];

    } else {
      points.df[[this.name]][ii] = profile[j];
    }
     
    if(is.null(.subset2(stderr.df, this.name, exact=TRUE))) {
     stderr.df[[this.name]] = NA;

     stderr.df[[this.name]][ii] = stderr[j];
    }
  }
}

# proceed if there are some values
pointsAllNA = sum(is.na(points.df)) == nrow(points.df) * ncol(points.df);
linesAllNA = sum(is.na(lines.df)) == nrow(lines.df) * ncol(lines.df);
if((!pointsAllNA && !linesAllNA) || (pointsAllNA || sum(points.df, na.rm=TRUE) > 0) || (linesAllNA || sum(lines.df, na.rm=TRUE) > 0)) {

screen(screens[screen.i]);
screen.i <- screen.i + 1;



# allow minor adjustments to profile
$rAdjustProfile

fold.induction.margin = 1;
if($yAxisFoldInductionFromM) {
  fold.induction.margin = 3.5;
}

isTimeSeries = FALSE;

x.coords = as.numeric(gsub(\" *[a-z-A-Z]+ *\", \"\", colnames(lines.df), perl=T));
x.coords.rank = rank(x.coords, na.last=$pointsLast);


# if the points df is all NA's that means we can plot as Time Series
if(sum(is.na(points.df)) == ncol(points.df) * nrow(points.df)) {
  x.min = min(x.min, x.coords, na.rm=TRUE);
  x.max = max(x.max, x.coords+x.coords*.1, na.rm=TRUE);

  y.max = max(y.max, max(lines.df, na.rm=T), na.rm=TRUE);
  y.min = min(y.min, min(lines.df, na.rm=T), na.rm=TRUE);

  x.coords = sort(x.coords);

  isTimeSeries = TRUE;
} else {
  x.min = 1;
  x.max = length(x.coords);

  if(sum(is.na(lines.df)) == ncol(lines.df) * nrow(lines.df)) {
    y.max = max(y.max, max(points.df, na.rm=T), na.rm=TRUE);
    y.min = min(y.min, min(points.df, na.rm=T), na.rm=TRUE);

  } else {
    y.max = max(y.max, max(points.df, na.rm=T), max(lines.df, na.rm=T), na.rm=TRUE);
    y.min = min(y.min, min(points.df, na.rm=T), min(lines.df, na.rm=T), na.rm=TRUE);
  }
  x.coords = seq(x.min, x.max);
  if($forceNoLines) {
    x.coords.rank = x.coords;
  }
}

new.points = as.data.frame(matrix(NA, ncol=ncol(points.df), nrow=nrow(points.df)));
new.lines = as.data.frame(matrix(NA, ncol=ncol(lines.df), nrow=nrow(lines.df)));

for(j in 1:length(x.coords.rank)) {
  colRank = x.coords.rank[j];

  new.lines[[colRank]] = as.data.frame(lines.df)[[j]];
  new.points[[colRank]] = as.data.frame(points.df)[[j]];

  colnames(new.lines)[colRank] = colnames(lines.df)[j];
  colnames(new.points)[colRank] = colnames(points.df)[j];
}

# set left margin size based on longest tick mark label

long.tick = nchar(max(pretty(c(y.min,y.max))));
left.margin.size = 4;

if((long.tick +1 ) > left.margin.size) {
    left.margin.size = ((long.tick)+1);
}

# extra legend size specified in # of lines

extra.legend.size = 0;
if($hasExtraLegend) {
  extra.legend.size = $extraLegendSize;
}

title.line = $titleLine;

if(!is.compact) {
  par(mar       = c($bottomMargin,left.margin.size,1.5 + title.line, fold.induction.margin + extra.legend.size), xpd=NA);
}

default.pch = c(15, 16, 17, 18, 7:10, 0:6);


#----------- META DATA --------

if ($hasMetaData) {

    sampleNamesFull = as.matrix(as.data.frame(strsplit(colnames(points.df), ':')));
    sampleNamesMeta = as.vector(sampleNamesFull[2,]);
    numeric.sample.names = as.numeric(gsub(\" *[a-z-A-Z]+ *\", \"\", sampleNamesMeta, perl=T));

    uniqueMeta = unique(sampleNamesMeta);

    numeric.unique.meta = unique(numeric.sample.names);

    if(sum(!is.na(numeric.unique.meta)) == length(numeric.unique.meta)) {
        colfunc = colorRampPalette(the.colors);

        sorted.unique.meta = sort(numeric.unique.meta);
        uniqueColors = colfunc(length(sorted.unique.meta)+1)[1:length(sorted.unique.meta)];
        the.colors = numeric.sample.names;
    } else {
        uniqueColors = rainbow(length(uniqueMeta));
        sorted.unique.meta = sort(uniqueMeta);
        the.colors = sampleNamesMeta;
    }

    for(i in 1:length(sorted.unique.meta)) {
     the.colors =  replace(the.colors, the.colors==sorted.unique.meta[i], uniqueColors[i]);
    }

     meta.legend.colors = uniqueColors;
     meta.legend.labels = sorted.unique.meta;
}

for(i in 1:nrow(lines.df)) {

  if(!is.null(points.pch)) {
    my.pch = points.pch[i];
  } 
  else {
    my.pch = default.pch[i];
  }
  if(i == 1) {
    plot(x.coords,
         type = \"n\",
         xlab = \"$xAxisLabel\",
         xlim = c(x.min, x.max),
         xaxt = \"n\",
         ylab = \"\",
         ylim = c(y.min, y.max),
         axes = FALSE
        );
      title(ylab=\"$yAxisLabel\", line=left.margin.size -1 ,);

    my.las= 0;
    my.at = axTicks(1);
    my.labels = colnames(new.lines)

    if($overrideXAxisLabels) {
      if(max(nchar(x.axis.label)) > 4) {
        my.las = 2;
      }

      if(isTimeSeries) {
        my.labels = x.axis.label;
      } else {
        my.at = 1:length(x.coords.rank);
        my.labels = x.axis.label;
      }
    } else {
      if(isTimeSeries) {
        my.at = NULL;
        my.labels = TRUE;
      } else {
          if(max(nchar(colnames(lines.df))) > 4) {
            my.las = 2;
          }
        my.at = 1:length(x.coords.rank);
        my.labels = colnames(new.lines);
      }
    }


    if (!$hasMetaData) {
      axis(1, at=my.at, labels=my.labels, las=my.las);
    }

   }
   # To have connected lines... you can't have NA's
   y.coords = new.lines[i,];
   colnames(y.coords) = as.character(x.coords);

   y.coords = y.coords[!is.na(colSums(y.coords))];
   x.coords.line = as.numeric(gsub(\" *[a-z-A-Z]+ *\", \"\", colnames(y.coords), perl=T));

   uniqueElements = length(unique(unlist(x.coords.line, use.names = FALSE)))
   if( ( $smoothLines || $smoothWithLoess ) ) {
     points(x.coords.line,
         y.coords,
         col  = 'grey75',
         bg   = 'grey75',
         type = ifelse(is.compact, \"n\", \"p\"),
         pch  = my.pch,
         cex  = 0.5
         );
      if ( ( uniqueElements > 3) ) {
         lines(x.coords.line,
               y.coords,
               col  = 'grey75',
               bg  = 'grey75',
               cex  = 0.5
               );

          if($smoothWithLoess) {
            lines(loess.smooth(x=x.coords.line, y=y.coords$df));
          }
          else {
         approxInterp = approx(x.coords.line, n=$splineApproxN);
         predict_x = approxInterp\$y;

         lines(predict(smooth.spline(x=x.coords.line, y=y.coords$df),predict_x),
               col  = the.colors[i],
               bg   = the.colors[i],
               cex  = 1
              );
         }

      } else {
         lines(x.coords.line,
               y.coords,
               col  = the.colors[i],
               bg   = the.colors[i],
               type = ifelse(is.compact, \"l\", \"o\"),
               pch  = my.pch,
               cex  = 1
              );
      }
   } else {


     if($isFilled && length(x.coords.line > 1)) {
       polygon( c( x.coords.line[1], x.coords.line, x.coords.line[length(x.coords.line)]),
                c( 0,         y.coords, 0),
                col = the.colors[i],
                border = the.colors[i]
              );
     }
     lines(x.coords.line,
          y.coords,
          col  = the.colors[i],
          bg   = the.colors[i],
          type = ifelse(is.compact, \"l\", \"o\"),
          pch  = my.pch,
          cex  = 1
         );

   }

 

   if($varyGlyphByXAxis) {
     my.pch = points.pch;
   }



if($forceConnectPoints) {
   lines(x.coords,
          new.points[i,],
          col  = the.colors[i],
          bg   = the.colors[i],
          type = ifelse(is.compact, \"l\", \"o\"),
          pch  = my.pch,
          cex  = 1
         );

}
else {
   points(x.coords,
          new.points[i,],
          col  = the.colors[i],
          bg   = the.colors[i],
          type = ifelse(is.compact, \"c\", \"p\"),
          pch  = my.pch,
          cex  = 1
         );
}


}

yAxis = axis(4,tick=F,labels=F);
if($yAxisFoldInductionFromM) {
  yaxis.labels = vector();

  for(i in 1:length(yAxis)) {
    value = yAxis[i];
    if(value > 0) {
      yaxis.labels[i] = round(2^value, digits=1)
    }
    if(value < 0) {
      yaxis.labels[i] = round(-1 * (1 / (2^value)), digits=1);
    }
    if(value == 0) {
      yaxis.labels[i] = 0;
    }
  }

  axis(4,at=yAxis,labels=yaxis.labels,tick=T);  
  axis(2,tick=T,labels=T);
  mtext('Fold Change', side=4, line=2, cex=$scale, las=0)
} else {
  axis(2);  

}
box();


if($hasExtraLegend && !is.compact) {
  # To add a legend into the margin... you need to convert ndc coordinates into user coordinates
  figureRegionXMax = par()\$fig[2];
  figureRegionYMax = par()\$fig[4];
  figureRegionYMin = par()\$fig[3];
  centerPoint = (figureRegionYMax + figureRegionYMin ) / 2;


  if ($hasLegendLabels) {
      my.labels = legend.label;
      my.cex = 0.8 * $scale;
      }

  if ($hasMetaData) {
     my.color = meta.legend.colors;
     my.labels = meta.legend.labels;
  }
  else {
    my.color = the.colors;
  }

  lapply(my.color, write, stderr(), append=TRUE, ncolumns=1000);

  legend(grconvertX(figureRegionXMax, from='ndc', to='user'),
         grconvertY(centerPoint, from='ndc', to='user'),
         my.labels,
         cex   = my.cex,
         ncol  = 1,
         col   = my.color,
         pt.bg = my.color,
         pch   = points.pch,
         lty   = 'solid',
         bty='n',
         xjust=1,
         yjust=0.5
        );
}

if(!is.compact) {
  $rPostscript
}

par(xpd=FALSE);

if(!is.compact) {
  grid(nx=NA,ny=NULL,col=\"gray75\");
}

lines (c(0,length(profile) * 2), c(0,0), col=\"gray25\");

plasmodb.title(\"$plotTitle\", line=title.line);

} else {
 $blankGraph;
}


";
  return $rcode;
}

1;

#--------------------------------------------------------------------------------

package EbrcWebsiteCommon::View::GraphPackage::LinePlot::Percentile;
use base qw( EbrcWebsiteCommon::View::GraphPackage::LinePlot );
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

package EbrcWebsiteCommon::View::GraphPackage::LinePlot::LogRatio;
use base qw( EbrcWebsiteCommon::View::GraphPackage::LinePlot );
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

package EbrcWebsiteCommon::View::GraphPackage::LinePlot::RMA;
use base qw( EbrcWebsiteCommon::View::GraphPackage::LinePlot );
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

package EbrcWebsiteCommon::View::GraphPackage::LinePlot::Filled;
use base qw( EbrcWebsiteCommon::View::GraphPackage::LinePlot );
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

package EbrcWebsiteCommon::View::GraphPackage::LinePlot::RNASeq;
use base qw( EbrcWebsiteCommon::View::GraphPackage::LinePlot );
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
  $self->setDefaultYMin(0);
  $self->setDefaultYMax(20);


  $self->setPointsPch(['NA']);

  $self->setSmoothLines(1);
  $self->setIsFilled(1);
  
  return $self;
}

#--------------------------------------------------------------------------------

package EbrcWebsiteCommon::View::GraphPackage::LinePlot::PairedEndRNASeq;
use base qw( EbrcWebsiteCommon::View::GraphPackage::LinePlot::RNASeq );
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

  return $self;
}


#--------------------------------------------------------------------------------

package EbrcWebsiteCommon::View::GraphPackage::LinePlot::QuantileNormalized;
use base qw( EbrcWebsiteCommon::View::GraphPackage::LinePlot );
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

package EbrcWebsiteCommon::View::GraphPackage::LinePlot::MRNADecay;
use base qw( EbrcWebsiteCommon::View::GraphPackage::LinePlot );
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

package EbrcWebsiteCommon::View::GraphPackage::LinePlot::QuantMassSpec;
use base qw( EbrcWebsiteCommon::View::GraphPackage::LinePlot );
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

package EbrcWebsiteCommon::View::GraphPackage::LinePlot::QuantMassSpecNonRatio;
use base qw( EbrcWebsiteCommon::View::GraphPackage::LinePlot );
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

package EbrcWebsiteCommon::View::GraphPackage::LinePlot::QuantMassSpecNonRatioUnlogged;
use base qw( EbrcWebsiteCommon::View::GraphPackage::LinePlot );
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
