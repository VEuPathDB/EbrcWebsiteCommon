package EbrcWebsiteCommon::View::GraphPackage::BarPlotSet;

use strict;
use vars qw( @ISA );

@ISA = qw( EbrcWebsiteCommon::View::GraphPackage::AbstractPlotSet );
use EbrcWebsiteCommon::View::GraphPackage::AbstractPlotSet;
use EbrcWebsiteCommon::View::GraphPackage::Util;



#--------------------------------------------------------------------------------

sub init {
  my $self = shift;
  my $args = ref $_[0] ? shift : {@_};

  $self->SUPER::init($args);

  # Defaults
  $self->setScreenSize(200);
  $self->setBottomMarginSize(2.5);

  return $self;
}

#--------------------------------------------------------------------------------

sub setMainLegend {
  my ($self, $hash) = @_;

  $hash->{fill} = 1;
  $hash->{points_pch} = [];
  $self->SUPER::setMainLegend($hash);
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

    my (@profileFiles, @elementNamesFiles, @stdevFiles);
    my $i = 0;

    # each part can have several profile sets
    foreach my $profileSetName (@{$profileSetsHash->{$part}->{profiles}}) {
      my $suffix = $part . $i;

      my ($profileFile, $elementNamesFile) = @{$self->writeProfileFiles($profileSetName, $suffix)};

      if($profileFile && $elementNamesFile) {
        push(@profileFiles, $profileFile);
        push(@elementNamesFiles, $elementNamesFile);
      }
      $i++;
    }

     foreach my $profileSetName (@{$profileSetsHash->{$part}->{stdev_profiles}}) {
       my $suffix = $part . $i;
       my ($stdevFile, $elementNamesFile) = @{$self->writeProfileFiles($profileSetName, $suffix)};
       push(@stdevFiles, $stdevFile);
       $i++;
     }

    next unless(scalar @profileFiles > 0);

    my $profileFilesString = EbrcWebsiteCommon::View::GraphPackage::Util::rStringVectorFromArray(\@profileFiles, 'profile.files');
    my $elementNamesString = EbrcWebsiteCommon::View::GraphPackage::Util::rStringVectorFromArray(\@elementNamesFiles, 'element.names.files');
    my $stdevString = EbrcWebsiteCommon::View::GraphPackage::Util::rStringVectorFromArray(\@stdevFiles, 'stdev.files');

    my $colors = $profileSetsHash->{$part}->{colors};
    my $rColorsString = EbrcWebsiteCommon::View::GraphPackage::Util::rStringVectorFromArray($colors, 'the.colors');

    my $rXAxisLabelsString;
    if(my $xAxisLabels = $profileSetsHash->{$part}->{x_axis_labels}) {
      $rXAxisLabelsString = EbrcWebsiteCommon::View::GraphPackage::Util::rStringVectorFromArray($xAxisLabels, 'element.names');
    }

    my $legend = $profileSetsHash->{$part}->{legend};
    my $rLegendString = EbrcWebsiteCommon::View::GraphPackage::Util::rStringVectorFromArray($legend, 'the.legend');

    my $rAdjustProfile = $profileSetsHash->{$part}->{r_adjust_profile};
    my $yAxisLabel = $profileSetsHash->{$part}->{y_axis_label};
    my $plotTitle = $profileSetsHash->{$part}->{plot_title};

    my $yMax = $profileSetsHash->{$part}->{default_y_max};
    my $yMin = $profileSetsHash->{$part}->{default_y_min};

    my $isStack = $profileSetsHash->{$part}->{stack_bars};


    my $horizontalXAxis = $profileSetsHash->{$part}->{force_x_axis_label_horizontal};
    my $yAxisFoldInductionFromM = $profileSetsHash->{$part}->{make_y_axis_fold_incuction};

    my $rCode = $self->rString($plotTitle, $profileFilesString, $elementNamesString, $stdevString, $rColorsString, $rLegendString, $yAxisLabel, $rXAxisLabelsString, $rAdjustProfile, $yMax, $yMin, $horizontalXAxis, $yAxisFoldInductionFromM, $isStack);

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
  my ($self, $plotTitle, $profileFiles, $elementNamesFiles, $stdevFiles, $colorsString, $legend, $yAxisLabel, $rAdjustNames, $rAdjustProfile, $yMax, $yMin, $horizontalXAxisLabels,  $yAxisFoldInductionFromM, $isStack) = @_;


  $yAxisLabel = $yAxisLabel ? $yAxisLabel : "Whoops! no y_axis_label";
  $rAdjustProfile = $rAdjustProfile ? $rAdjustProfile : "";
  $rAdjustNames = $rAdjustNames ? $rAdjustNames : "";

  $yMax = defined($yMax) ? $yMax : 10;
  $yMin = defined($yMin) ? $yMin : 0;

  $horizontalXAxisLabels = defined($horizontalXAxisLabels) ? 'TRUE' : 'FALSE';

  $yAxisFoldInductionFromM = defined($yAxisFoldInductionFromM) ? 'TRUE' : 'FALSE';

  my $beside = defined($isStack) ? 'FALSE' : 'TRUE';

  my $bottomMargin = $self->getBottomMarginSize();

  my $rv = "
# ---------------------------- BAR PLOT ----------------------------

$profileFiles
$elementNamesFiles
$stdevFiles
$colorsString
$legend

y.min = $yMin;
y.max = $yMax;

screen(screens[screen.i]);
screen.i <- screen.i + 1;

profile = vector();
for(i in 1:length(profile.files)) {
  tmp = read.table(profile.files[i], header=T, sep=\"\\t\");

  if(!is.null(tmp\$ELEMENT_ORDER)) {
    tmp = aggregate(tmp, list(tmp\$ELEMENT_ORDER), mean, na.rm=T)
  }
  profile = rbind(profile, tmp\$VALUE);
}

element.names = vector(\"character\");
for(i in 1:length(element.names.files)) {
  tmp = read.table(element.names.files[i], header=T, sep=\"\\t\");
  element.names = rbind(element.names, as.vector(tmp\$NAME));
}

stdev = vector();
 if(!is.null(stdev.files)) {
   for(i in 1:length(stdev.files)) {
     tmp = read.table(stdev.files[i], header=T, sep=\"\\t\");
     stdev = rbind(stdev, tmp\$VALUE);
   }
 }

if(!length(stdev) > 0) {
  stdev = 0;
}


par(mar       = c($bottomMargin,4,1,4), xpd=FALSE, oma=c(1,1,1,1));

# Allow Subclass to fiddle with the data structure and x axis names
$rAdjustProfile
$rAdjustNames


if($beside) {
  d.max = max(1.1 * profile, 1.1 * (profile + stdev), y.max, na.rm=TRUE);
  d.min = min(1.1 * profile, 1.1 * (profile - stdev), y.min, na.rm=TRUE);
  my.space=c(0,.5);
} else {
  d.max = max(1.1 * profile, 1.1 * apply(profile, 2, sum), y.max, na.rm=TRUE);
  d.min = min(1.1 * profile, 1.1 * apply(profile, 2, sum), y.min, na.rm=TRUE);
  my.space = 0.2;
}

my.las = 2;
if(max(nchar(element.names)) < 6 || $horizontalXAxisLabels) {
  my.las = 0;
}

plotXPos = barplot(profile,
           col       = the.colors,
           ylim      = c(d.min, d.max),
           beside    = $beside,
           names.arg = element.names,
           space = my.space,
           las = my.las,
           axes = FALSE,
           cex.names = 0.8
          );


mtext('$yAxisLabel', side=2, line=3.5, cex.lab=1, las=0)

if(length(the.legend) > 0) {
  legend(11, d.max, legend=the.legend, cex=0.9, fill=the.colors, inset=0.2) ;
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

lines (c(0,length(profile) * 2), c(0,0), col=\"gray25\");

for(i in 1:nrow(profile)) {
  for(j in 1:ncol(profile)) {
    if(is.na(profile[i,j])) {
      x_coord = plotXPos[i,j];
      y_coord = (d.min + d.max) / 2;
      points(x_coord, y_coord, cex=2, col=\"red\", pch=8);
    }
  }
}

lowerBound = profile - stdev;
upperBound = profile + stdev;
suppressWarnings(arrows(plotXPos, lowerBound,  plotXPos, upperBound, angle=90, code=3, length=0.05, lw=2));


box();
plasmodb.title(\"$plotTitle\");

";

  return $rv;
}






