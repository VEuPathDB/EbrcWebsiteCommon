package EbrcWebsiteCommon::View::GraphPackage::LinePlotSet;

use strict;
use vars qw( @ISA );

@ISA = qw( EbrcWebsiteCommon::View::GraphPackage::AbstractPlotSet );
use EbrcWebsiteCommon::View::GraphPackage::AbstractPlotSet;
use EbrcWebsiteCommon::View::GraphPackage::Util;

#--------------------------------------------------------------------------------

sub getForceNoLines              { $_[0]->{'_force_no_lines'   }}
sub setForceNoLines              { $_[0]->{'_force_no_lines'   } = $_[1]; $_[0] }

sub getVaryGlyphByXAxis          { $_[0]->{'_vary_glyph_by_x_axis'   }}
sub setVaryGlyphByXAxis          { $_[0]->{'_vary_glyph_by_x_axis'   } = $_[1]; $_[0] }

#--------------------------------------------------------------------------------

sub init {
  my $self = shift;
  my $args = ref $_[0] ? shift : {@_};

  $self->SUPER::init($args);

  # Defaults
  $self->setScreenSize(225);
  $self->setBottomMarginSize(4.5);

  return $self;
}

#--------------------------------------------------------------------------------

sub makeRPlotStrings {
  my ($self) = @_;

  my @rv;

  my $profileSetsHash = $self->getProfileSetsHash();

  my $ms = $self->getMultiScreen();

  my %isVis_b = $ms->partIsVisible();

  foreach my $part (keys %$profileSetsHash) {
    next unless ($isVis_b{$part});

    my (@profileFiles, @elementNamesFiles);

    # each part can have several profile sets
    my $i = 0;
    foreach my $profileSetName (@{$profileSetsHash->{$part}->{profiles}}) {
      my $suffix = $part . $i;

      my ($profileFile, $elementNamesFile) = @{$self->writeProfileFiles($profileSetName, $suffix)};

      push(@profileFiles, $profileFile);
      push(@elementNamesFiles, $elementNamesFile);

      $i++;
    }

    my $profileFilesString = EbrcWebsiteCommon::View::GraphPackage::Util::rStringVectorFromArray(\@profileFiles, 'profile.files');
    my $elementNamesString = EbrcWebsiteCommon::View::GraphPackage::Util::rStringVectorFromArray(\@elementNamesFiles, 'element.names.files');

    my $colors = $profileSetsHash->{$part}->{colors};
    my $rColorsString = EbrcWebsiteCommon::View::GraphPackage::Util::rStringVectorFromArray($colors, 'the.colors');

    my $pointsPch = $profileSetsHash->{$part}->{points_pch};
    my $rPointsPchString = EbrcWebsiteCommon::View::GraphPackage::Util::rNumericVectorFromArray($pointsPch, 'points.pch');

    my $yAxisLabel = $profileSetsHash->{$part}->{y_axis_label};
    my $xAxisLabel = $profileSetsHash->{$part}->{x_axis_label};
    my $plotTitle = $profileSetsHash->{$part}->{plot_title};

    my $yMax = $profileSetsHash->{$part}->{default_y_max};
    my $yMin = $profileSetsHash->{$part}->{default_y_min};

    my $xMin = $profileSetsHash->{$part}->{default_x_min};
    my $xMax = $profileSetsHash->{$part}->{default_x_max};

    my $pointsLast = $profileSetsHash->{$part}->{are_points_last};
    my $yAxisFoldInductionFromM = $profileSetsHash->{$part}->{make_y_axis_fold_incuction};


    my $rAdjustProfile = $profileSetsHash->{$part}->{r_adjust_profile};
    my $rTopMarginTitle = $profileSetsHash->{$part}->{r_top_margin_title};

    my $smoothLines = $profileSetsHash->{$part}->{smooth_spline};
    my $splineApproxN = $profileSetsHash->{$part}->{spline_approx_n};

    my $rCode = $self->rString($plotTitle, $profileFilesString, $elementNamesString, $rColorsString, $rPointsPchString, $yAxisLabel, $xAxisLabel, $yMax, $yMin, $xMax, $xMin, $pointsLast, $yAxisFoldInductionFromM, $rAdjustProfile, $rTopMarginTitle, $smoothLines,$splineApproxN);

    my $profileNames = $profileSetsHash->{$part}->{profile_display_names};
    if ($profileNames){
      $self->addToProfileDataMatrix(\@profileFiles, \@elementNamesFiles, $profileNames);
    } else {
      $self->addToProfileDataMatrix(\@profileFiles, \@elementNamesFiles, $profileSetsHash->{$part}->{profiles});
    }

    unshift @rv, $rCode;
  }

  $self->makeHtmlStringFromMatrix();

  return \@rv;
}

#--------------------------------------------------------------------------------

sub rString {
  my ($self, $plotTitle, $profileFiles, $elementNamesFiles, $colorsString, $pointsPchString, $yAxisLabel, $xAxisLabel, $yMax, $yMin, $xMax, $xMin, $pointsLast, $yAxisFoldInductionFromM, $rAdjustProfile, $rTopMarginTitle, $smoothLines,$splineApproxN) = @_;

  $yAxisLabel = $yAxisLabel ? $yAxisLabel : "Whoops! no y_axis_label";
  $xAxisLabel = $xAxisLabel ? $xAxisLabel : "Whoops! no x_axis_label";

  $yMax = $yMax ? $yMax : "-Inf";
  $yMin = defined($yMin) ? $yMin : "Inf";

  $xMax = $xMax ? $xMax : "-Inf";
  $xMin = defined($xMin) ? $xMin : "Inf";

  $pointsLast = defined($pointsLast) ? 'TRUE' : 'FALSE';

  $smoothLines = defined($smoothLines) ? 'TRUE' : 'FALSE';

  $yAxisFoldInductionFromM = defined($yAxisFoldInductionFromM) ? 'TRUE' : 'FALSE';

  my $forceNoLines = defined($self->getForceNoLines()) ? 'TRUE' : 'FALSE';
  my $varyGlyphByXAxis = defined($self->getVaryGlyphByXAxis()) ? 'TRUE' : 'FALSE';

  $rAdjustProfile = $rAdjustProfile ? $rAdjustProfile : "";
  $rTopMarginTitle = $rTopMarginTitle ? $rTopMarginTitle : "";

  $splineApproxN = defined($splineApproxN) ? $splineApproxN : 60;

  my $bottomMargin = $self->getBottomMarginSize();

  my $rv = "
# ---------------------------- LINE PLOT ----------------------------

$profileFiles
$elementNamesFiles
$colorsString
$pointsPchString

screen(screens[screen.i]);
screen.i <- screen.i + 1;
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

for(i in 1:length(profile.files)) {
  profile.df = read.table(profile.files[i], header=T, sep=\"\\t\");

  if(!is.null(profile.df\$ELEMENT_ORDER)) {
    profile.df = aggregate(profile.df, list(profile.df\$ELEMENT_ORDER), mean, na.rm=T)
  }
  profile = profile.df\$VALUE;

  element.names.df = read.table(element.names.files[i], header=T, sep=\"\\t\");
  element.names = as.character(element.names.df\$NAME);

# allow minor adjustments to profile
$rAdjustProfile

  element.names.numeric = as.numeric(sub(\" *[a-z-A-Z]+ *\", \"\", element.names, perl=T));
   is.numeric.element.names = !is.na(element.names.numeric);

  if($forceNoLines) {
    element.names.numeric = NA;
    is.numeric.element.names = is.numeric.element.names == 'BANANAS';
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
      lines.df[[this.name]][i] = profile[j];

    } else {
      points.df[[this.name]][i] = profile[j];
    }
  }
}

isTimeSeries = FALSE;

x.coords = as.numeric(sub(\" *[a-z-A-Z]+ *\", \"\", colnames(lines.df), perl=T));
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

  new.lines[[colRank]] = lines.df[[j]];
  new.points[[colRank]] = points.df[[j]];

  colnames(new.lines)[colRank] = colnames(lines.df)[j];
  colnames(new.points)[colRank] = colnames(points.df)[j];
}

par(mar       = c($bottomMargin,4,2,4), xpd=TRUE);

my.pch = 15;

for(i in 1:nrow(lines.df)) {

  if(!is.null(points.pch)) {
    my.pch = points.pch[i];
  }

  if(i == 1) {
    plot(x.coords,
         type = \"n\",
         xlab = \"$xAxisLabel\",
         xlim = c(x.min, x.max),
         xaxt = \"n\",
         ylab = \"$yAxisLabel\",
         ylim = c(y.min, y.max),
         axes = FALSE
        );


    if(isTimeSeries) {
      axis(1);

    } else {
      my.las = 2;
      if(max(nchar(colnames(lines.df))) < 6) {
        my.las = 0;
      }

      axis(1, at=x.coords.rank, labels=colnames(lines.df), las=my.las);
    }
  }

  # To have connected lines... you can't have NA's
  y.coords = new.lines[i,];
  colnames(y.coords) = as.character(x.coords);

  y.coords = y.coords[,!is.na(colSums(y.coords))];
  x.coords.line = as.numeric(sub(\" *[a-z-A-Z]+ *\", \"\", colnames(y.coords), perl=T));

  if($smoothLines) {
    points(x.coords.line,
         y.coords,
         col  = 'grey75',
         bg   = 'grey75',
         type = \"p\",
         pch  = my.pch,
         cex  = 0.5
         );

    lines(x.coords.line,
         y.coords,
         col  = 'grey75',
         bg  = 'grey75',
         cex  = 0.5
         );

    approxInterp = approx(x.coords.line, n=$splineApproxN);
    predict_x = approxInterp\$y;

    lines(predict(smooth.spline(x=x.coords.line, y=y.coords),predict_x),
         col  = the.colors[i],
         bg   = the.colors[i],
         cex  = 1
         );

  } else {
    lines(x.coords.line,
         y.coords,
         col  = the.colors[i],
         bg   = the.colors[i],
         type = \"o\",
         pch  = my.pch,
         cex  = 1
         );
  }


  my.color = the.colors[i];
  if($varyGlyphByXAxis) {
    my.pch = points.pch;
    my.color = the.colors;
  }


  points(x.coords,
       new.points[i,],
       col  = my.color,
       bg   = my.color,
       type = \"p\",
       pch  = my.pch,
       cex  = 1
       );
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
  mtext('Fold Change', side=4, line=2, cex.lab=1, las=0)
} else {
  axis(2);  

}
box();

$rTopMarginTitle


par(xpd=FALSE);
grid(nx=NA,ny=NULL,col=\"gray75\");
lines (c(0,length(profile) * 2), c(0,0), col=\"gray25\");


plasmodb.title(\"$plotTitle\");

";

  return $rv;
}





1;
