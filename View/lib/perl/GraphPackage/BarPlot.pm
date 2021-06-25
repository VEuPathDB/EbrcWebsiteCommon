package EbrcWebsiteCommon::View::GraphPackage::BarPlot;

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

  my ($profileFiles, $elementNamesFiles, $stderrFiles);

  my $blankGraph = $self->blankPlotPart();

  eval{
   ($profileFiles, $elementNamesFiles, $stderrFiles) = $self->makeFilesForR($idType);
 };

  if($@) {
    return $blankGraph;
  }

  foreach(@{$self->getProfileSets()}) {



    if(scalar @{$_->errors()} > 0) {
      return $blankGraph;

    }
  }
  my $colors = $self->getColors();

  my $colorsString = EbrcWebsiteCommon::View::GraphPackage::Util::rStringVectorFromArray($colors, 'the.colors');

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

  my $isCompactString = "FALSE";

  if($self->isCompact()) {
    $isCompactString = "TRUE";
  }

  my $isStack = $self->getIsStacked();
  my $isHorizontal = $self->getIsHorizontal();

  my $horizontalXAxisLabels = $self->getForceHorizontalXAxis();

  my $yAxisFoldInductionFromM = $self->getMakeYAxisFoldInduction();
  my $highlightMissingValues = $self->getHighlightMissingValues();

  $highlightMissingValues = $highlightMissingValues ? 'TRUE' : 'FALSE';

  $rAdjustProfile = $rAdjustProfile ? $rAdjustProfile : "";

  $horizontalXAxisLabels = $horizontalXAxisLabels ? 'TRUE' : 'FALSE';

  $yAxisFoldInductionFromM = $yAxisFoldInductionFromM ? 'TRUE' : 'FALSE';

  my $beside = $isStack ? 'FALSE' : 'TRUE';
  my $horiz = $isHorizontal && !$self->isCompact() ? 'TRUE' : 'FALSE';

  my $titleLine = $self->getTitleLine();

  my $bottomMargin = $self->getElementNameMarginSize();
  my $spaceBetweenBars = $self->getSpaceBetweenBars();

  my $scale = $self->getScalingFactor;

  my $hasExtraLegend = $self->getHasExtraLegend() ? 'TRUE' : 'FALSE';
  my $legendLabels = $self->getLegendLabels();

  my ($legendLabelsString, $legendColors, $legendColorsString);
  if ($hasExtraLegend ) {
      $legendLabelsString = EbrcWebsiteCommon::View::GraphPackage::Util::rStringVectorFromArray($legendLabels, 'legend.label');

      $legendColors = $self->getLegendColors();
      $legendColors = $colors if !($legendColors);
      $legendColorsString = EbrcWebsiteCommon::View::GraphPackage::Util::rStringVectorFromArray($legendColors, 'legend.colors');
    }

  my $hasLegendLabels = $legendLabelsString ? 'TRUE' : 'FALSE';

  my $extraLegendSize = $self->getExtraLegendSize();

  my $axisPadding = $self->getAxisPadding();

  print STDERR Dumper $profileFiles;
  print STDERR Dumper $elementNamesFiles;

  my $rv = "
# ---------------------------- BAR PLOT ----------------------------

$profileFiles
$elementNamesFiles
$stderrFiles
$colorsString
$sampleLabelsString
$legendLabelsString
$legendColorsString

is.compact=$isCompactString;


#-------------------------------------------------------------------

if(length(profile.files) != length(element.names.files)) {
  stop(\"profile.files length not equal to element.names.files length\");
}

y.min = $yMin;
y.max = $yMax;

# Create Data Frames to collect values to be plotted
profile.df = as.data.frame(matrix(nrow=length(profile.files)));
profile.df\$V1 = NULL;

stderr.df = as.data.frame(matrix(nrow=length(profile.files)));
stderr.df\$V1 = NULL;


for(i in 1:length(profile.files)) {
  skip.stderr = $skipStdErr;
  profile.tmp = read.table(profile.files[i], header=T, sep=\"\\t\");

  if(!is.null(profile.tmp\$ELEMENT_ORDER)) {
    eo.count = length(profile.tmp\$ELEMENT_ORDER);

    if(!is.numeric(profile.tmp\$ELEMENT_ORDER)) {
      stop(\"Elemnet order must be numeric for aggregation\");
    }
    profile.tmp = aggregate(profile.tmp, list(profile.tmp\$ELEMENT_ORDER), mean, na.rm=T)
    if(length(profile.tmp\$ELEMENT_ORDER) != eo.count) {
      skip.stderr = TRUE;
    }

  }
  profile = profile.tmp\$VALUE;

  element.names.df = read.table(element.names.files[i], header=T, sep=\"\\t\");
  element.names = as.character(element.names.df\$NAME);

   if(!skip.stderr && !is.na(stderr.files[i]) && stderr.files[i] != '') {
     stderr.tmp = read.table(stderr.files[i], header=T, sep=\"\\t\");

    stderr = stderr.tmp\$VALUE;
   } else {
     stderr = element.names;
     stderr = NA;
   }


  for(j in 1:length(element.names)) {
    this.name = element.names[j];

    if(is.null(.subset2(profile.df, this.name, exact=TRUE))) {
      profile.df[[this.name]] = NA;
    }


    profile.df[[this.name]][i] = profile[j];

    if(is.null(.subset2(stderr.df, this.name, exact=TRUE))) {
     stderr.df[[this.name]] = NA;
    }

    stderr.df[[this.name]][i] = stderr[j];
  }
}

# blank graph if all values are zero
if(abs(sum(profile.df, na.rm=TRUE)) > 0) {

screen(screens[screen.i]);
screen.i <- screen.i + 1;


# allow minor adjustments to profile
$rAdjustProfile


fold.induction.margin = 1;
if($yAxisFoldInductionFromM) {
  fold.induction.margin = 3.5;
}


# stderr.df will either be the same dim as profile.df or 0
if(length(stderr.df) == 0) {
  stderr.df = 0;
}


my.space = $spaceBetweenBars;

if($beside) {
  d.max = max($axisPadding * profile.df, $axisPadding * (profile.df + stderr.df), y.max, na.rm=TRUE);
  d.min = min($axisPadding * profile.df, $axisPadding * (profile.df - stderr.df), y.min, na.rm=TRUE);
  my.space=c(0, my.space);
} else {
  d.max = max($axisPadding * profile.df, $axisPadding * apply(profile.df, 2, sum), y.max, na.rm=TRUE);
  d.min = min($axisPadding * profile.df, $axisPadding * apply(profile.df, 2, sum), y.min, na.rm=TRUE);
  my.space = my.space;
}

# set left margin size based on longest tick mark label

long.tick = nchar(max(pretty(c(d.min,d.max))));

left.margin.size = 4;

if((long.tick +1 ) > left.margin.size) {
    left.margin.size = ((long.tick)+1);
}

# c(bottom,left,top,right)

# extra legend size specified in # of lines

extra.legend.size = 0;
if($hasExtraLegend) {
  extra.legend.size = $extraLegendSize;
}


title.line = $titleLine;

if(is.compact) {
  par(mar       = c(0,0,0,0),xaxt=\"n\", bty=\"n\", xpd=TRUE);
}


if($overrideXAxisLabels) {
  my.labels = x.axis.label;
} else {
  my.labels = colnames(profile.df);
}

if($lasString) {
    my.las = $las;
} else if(max(nchar(my.labels)) > 4 && !($horizontalXAxisLabels)) {
    my.las = 2;
} else {
    my.las = 0;
}

if ($axisLtyString) {
    my.axis.lty = $axisLty;
} else {
    my.axis.lty = \"solid\";
}


#names.margin = $bottomMargin;


if($horiz) {

names.margin = max(round(max(nchar(my.labels)) / 2), 3);

  par(mar       = c(5, names.margin,title.line + fold.induction.margin, 1 + extra.legend.size), xpd=NA, oma=c(1,1,1,1));
  x.lim = c(d.min, d.max);
  y.lim = NULL;

  yaxis.side = 1;
  foldchange.side = 3;

  yaxis.line = 2;

} else {

names.margin = max(round(max(nchar(my.labels)) / 2.5), 3);

  if(!is.compact) {
    par(mar       = c(names.margin,left.margin.size,1.5 + title.line,fold.induction.margin + extra.legend.size), xpd=NA, cex=$scale);
  } 
  y.lim = c(d.min, d.max);
  x.lim = NULL;

  yaxis.side = 2;
  foldchange.side = 4;

  yaxis.line = left.margin.size - 1;
}




showAxisNames = FALSE;
if($horiz || nrow(profile.df) > 1) {
  showAxisNames = TRUE;
}

  plotXPos = barplot(as.matrix(profile.df),
             col       = the.colors,
             xlim      = x.lim,
             ylim      = y.lim,
             beside    = $beside,
             axisnames = showAxisNames,
             axes = FALSE,
             names.arg = my.labels,
             space = my.space,
             las = my.las,
             axis.lty = my.axis.lty,
             horiz=$horiz,
            );


if(!$horiz && nrow(profile.df) == 1) {
  text(plotXPos, par(\"usr\")[3], labels = my.labels, srt = 45, adj = c(1,1.1), xpd = TRUE)
}

mtext('$yAxisLabel', side=yaxis.side, line=yaxis.line, cex=$scale, las=0)
yAxis = axis(foldchange.side, tick=F, labels=F);


if($yAxisFoldInductionFromM && !is.compact) {
  foldchange.labels = vector();

  for(i in 1:length(yAxis)) {
    value = yAxis[i];
    if(value > 0) {
      foldchange.labels[i] = round(2^value, digits=1)
    }
    if(value < 0) {
      foldchange.labels[i] = round(-1 * (1 / (2^value)), digits=1);
    }
    if(value == 0) {
      foldchange.labels[i] = 0;
    }
  }

  mtext('Fold Change', side=foldchange.side, line=2, cex=$scale, las=0)
  axis(foldchange.side,at=yAxis,labels=foldchange.labels,tick=T);  
  axis(yaxis.side,tick=T,labels=T);
} else {
  axis(yaxis.side);
}

lowerBound = as.matrix(profile.df - stderr.df);
upperBound = as.matrix(profile.df + stderr.df);


plotLength = max(plotXPos) + min(plotXPos);


if(!is.compact) {
if($horiz) {
#  lines (c(0,0), c(0,length(profile.df) * 2), col=\"gray25\");
  lines (c(0,0), c(0,plotLength), col=\"gray25\");

  suppressWarnings(arrows(lowerBound,  plotXPos, upperBound, plotXPos, angle=90, code=3, length=0.05, lw=2));
} else {
#  lines (c(0,length(profile.df) * 2), c(0,0), col=\"gray25\");
  lines (c(0,plotLength), c(0,0), col=\"gray25\");



  if($highlightMissingValues) {
    for(i in 1:nrow(profile.df)) {
      for(j in 1:ncol(profile.df)) {
        if(is.na(profile.df[i,j])) {
          x_coord = plotXPos[i,j];
          y_coord = (d.min + d.max) / 2;
          points(x_coord, y_coord, cex=2, col=\"red\", pch=8);
        }
      }
    }
  }
  suppressWarnings(arrows(plotXPos, lowerBound,  plotXPos, upperBound, angle=90, code=3, length=0.05, lw=2));

}
}

box();


if($hasExtraLegend && !is.compact) {
  # To add a legend into the margin... you need to convert ndc coordinates into user coordinates
  figureRegionXMax = par()\$fig[2];
  figureRegionYMax = par()\$fig[4];

  if ($hasLegendLabels) {
      my.labels = legend.label;
      }

  legend(grconvertX(figureRegionXMax, from='ndc', to='user'),
         grconvertY(figureRegionYMax, from='ndc', to='user'),
         my.labels,
         cex   = (0.8 * $scale),
         ncol  = 1,
         fill=legend.colors,
         bty='n',
         xjust=1,
         yjust=1
        );
}

  plasmodb.title(\"$plotTitle\", line=title.line);

} else {
 $blankGraph;
}

";

  return $rv;
}

1;

package EbrcWebsiteCommon::View::GraphPackage::BarPlot::RMA;
use base qw( EbrcWebsiteCommon::View::GraphPackage::BarPlot );
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
    $self->setAdjustProfile('profile.df = 2^(profile.df);stderr.df = 2^stderr.df;');
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

package EbrcWebsiteCommon::View::GraphPackage::BarPlot::Percentile;
use base qw( EbrcWebsiteCommon::View::GraphPackage::BarPlot );
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



package EbrcWebsiteCommon::View::GraphPackage::BarPlot::RNASeqSpliced;
use base qw( EbrcWebsiteCommon::View::GraphPackage::BarPlot );
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




package EbrcWebsiteCommon::View::GraphPackage::BarPlot::RNASeq;
use base qw( EbrcWebsiteCommon::View::GraphPackage::BarPlot );
use strict;

sub new {
  my $class = shift; 
  my $self = $class->SUPER::new(@_);

  my $id = $self->getId();
  my $wantLogged = $self->getWantLogged();
  my $exprMetric = $self->getExpressionMetric();
  $exprMetric = defined($exprMetric) ? $exprMetric : "fpkm";

  $self->setPartName($exprMetric);
  $exprMetric = uc($exprMetric);
  $self->setYaxisLabel($exprMetric);
  $self->setIsStacked(0);
  $self->setDefaultYMin(0);
  $self->setDefaultYMax(10);
  $self->setPlotTitle("$exprMetric - $id");

  if($wantLogged) {
    $self->setAdjustProfile('profile.df=profile.df + 1; profile.df = log2(profile.df);');
    $self->setYaxisLabel("$exprMetric (log2)");
    $self->setIsLogged(1);
    $self->setDefaultYMax(4);
    $self->setSkipStdErr(1);
  }

  return $self;
}

package EbrcWebsiteCommon::View::GraphPackage::BarPlot::PairedEndRNASeqStacked;
use base qw( EbrcWebsiteCommon::View::GraphPackage::BarPlot::RNASeq);
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

#--------------------------------------------------------------------------------

package EbrcWebsiteCommon::View::GraphPackage::BarPlot::LogRatio;
use base qw( EbrcWebsiteCommon::View::GraphPackage::BarPlot );
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

package EbrcWebsiteCommon::View::GraphPackage::BarPlot::QuantileNormalized;
use base qw( EbrcWebsiteCommon::View::GraphPackage::BarPlot );
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

package EbrcWebsiteCommon::View::GraphPackage::BarPlot::MRNADecay;
use base qw( EbrcWebsiteCommon::View::GraphPackage::BarPlot );
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


package EbrcWebsiteCommon::View::GraphPackage::BarPlot::Standardized;
use base qw( EbrcWebsiteCommon::View::GraphPackage::BarPlot );
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

package EbrcWebsiteCommon::View::GraphPackage::BarPlot::MassSpec;
use base qw( EbrcWebsiteCommon::View::GraphPackage::BarPlot );
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

package EbrcWebsiteCommon::View::GraphPackage::BarPlot::QuantMassSpec;
use base qw( EbrcWebsiteCommon::View::GraphPackage::BarPlot );
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

package EbrcWebsiteCommon::View::GraphPackage::BarPlot::QuantMassSpecNonRatio;
use base qw( EbrcWebsiteCommon::View::GraphPackage::BarPlot );
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

package EbrcWebsiteCommon::View::GraphPackage::BarPlot::QuantMassSpecNonRatioUnlogged;
use base qw( EbrcWebsiteCommon::View::GraphPackage::BarPlot );
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



package EbrcWebsiteCommon::View::GraphPackage::BarPlot::SageTag;
use base qw( EbrcWebsiteCommon::View::GraphPackage::BarPlot );
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



package EbrcWebsiteCommon::View::GraphPackage::BarPlot::Genera;
use base qw( EbrcWebsiteCommon::View::GraphPackage::BarPlot );
use strict;

sub new {
  my $class = shift; 
   my $self = $class->SUPER::new(@_);

   my $id = $self->getId();

   $self->setDefaultYMax(0.2);
   $self->setDefaultYMin(0);
   $self->setYaxisLabel('');

   $self->setPartName('sage_tags');
   $self->setPlotTitle("Genera - $id");

   $self->setMakeYAxisFoldInduction(0);
   $self->setIsLogged(0);

  $self->setAxisPadding(1);
   $self->setSpaceBetweenBars(0);
   return $self;
}


1;


