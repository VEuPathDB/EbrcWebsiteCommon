package EbrcWebsiteCommon::View::GraphPackage::AbstractPlotSet;

use strict;
use vars qw( @ISA );

@ISA = qw( EbrcWebsiteCommon::View::GraphPackage );
use EbrcWebsiteCommon::View::GraphPackage;


use EbrcWebsiteCommon::View::MultiScreen;
use EbrcWebsiteCommon::View::GraphPackage::Util;

use Data::Dumper;
use FileHandle;

#--------------------------------------------------------------------------------

#TODO: would like to factor out into PlotPart.pm
sub getScreenSize                { $_[0]->{'_screen_size'                 }}
sub setScreenSize                { $_[0]->{'_screen_size'                 } = $_[1]; $_[0] }

#TODO: this needs to be factored into PlotPart
sub getGraphDefaultValue         { $_[0]->{'_graph_default_value'         }}
sub setGraphDefaultValue         { $_[0]->{'_graph_default_value'         } = $_[1]; $_[0] }

#TODO: needs would like to factor into PlotPart
sub getBottomMarginSize          { $_[0]->{'_bottom_margin_size'          }}
sub setBottomMarginSize          { $_[0]->{'_bottom_margin_size'          } = $_[1]; $_[0] }

sub getProfileSetsHash           { $_[0]->{'_profile_sets_hash'           } }
sub setProfileSetsHash           { $_[0]->{'_profile_sets_hash'           } = $_[1]; $_[0] }

sub getMultiScreen               { $_[0]->{'_multi_screen'                } }
sub setMultiScreen               { $_[0]->{'_multi_screen'                } = $_[1]; $_[0] }

sub getFileHandle                { $_[0]->{'_file_handle'                 } }
sub setFileHandle                { $_[0]->{'_file_handle'                 } = $_[1]; $_[0] }

sub getPlotWidth                 { $_[0]->{'_plot_width'                  } }
sub setPlotWidth                 { $_[0]->{'_plot_width'                  } = $_[1]; $_[0] }

sub getMainLegend                { $_[0]->{'_main_legend'                 }}
sub setMainLegend                { $_[0]->{'_main_legend'                 } = $_[1]; $_[0] }

sub getLegendSize                { $_[0]->{'_legend_size'                 }}
sub setLegendSize                { $_[0]->{'_legend_size'                 } = $_[1]; $_[0] }

sub getAllNames                  { $_[0]->{'_all_names'                   }}
sub setAllNames                  { $_[0]->{'_all_names'                   } = $_[1]; $_[0] }

sub getAllValues                 { $_[0]->{'_all_values'                  }}
sub setAllValues                 { $_[0]->{'_all_values'                  } = $_[1]; $_[0] }

sub getTempFiles                 { $_[0]->{'_temp_files'                  }}
sub setTempFiles                 { $_[0]->{'_temp_files'                  } = $_[1]; $_[0] }
sub addTempFile {
  my ($self, $file) = @_;

  push @{$self->getTempFiles()}, $file;
}

#--------------------------------------------------------------------------------
# Abstract methods
#--------------------------------------------------------------------------------

sub makeRPlotStrings {}

#--------------------------------------------------------------------------------

sub init {
  my ($self) = @_;

  $self->SUPER::init(@_);

  my $r_f = $self->getOutputFile(). '.R';
  my $r_fh = FileHandle->new(">$r_f") || die "Can not open R file '$r_f': $!";

  $self->setFileHandle($r_fh);

  # Default 
  $self->setPlotWidth(425);
  $self->setLegendSize(40);

  $self->setTempFiles([]);

  $self->setProfileSetsHash([]);

  $self->setAllNames([]);
  $self->setAllValues({});

  $self;
}

#--------------------------------------------------------------------------------
#TODO: needs to be factored out into PlotPart.pm/ Also needs to be added to BarPlot/LinePlot 
sub hasGraphDefault {
  my ($self) = @_;

  if(defined($self->getGraphDefaultValue())) {
    return 1;
  }
  return 0;
}

#--------------------------------------------------------------------------------

sub makeRLegendString {
  my ($self) = @_;

  my $legendHash = $self->getMainLegend();

  unless($legendHash) {
    return "  screen(screens[screen.i]);
  screen.i <- screen.i + 1;";
  }

  my $colors = $legendHash->{colors};
  my $legendColors = ($legendHash->{legendColors})? $legendHash->{legendColors}:$colors ;
  my $names = $legendHash->{short_names};
  my $pch = $legendHash->{points_pch};
  my $fill = $legendHash->{fill};
  my $nCols = $legendHash->{cols};

  my $rColorsString = EbrcWebsiteCommon::View::GraphPackage::Util::rStringVectorFromArray($legendColors, 'legend.colors');
  my $rNamesString = EbrcWebsiteCommon::View::GraphPackage::Util::rStringVectorFromArray($names, 'legend.names');
  my $rPointsPchString = EbrcWebsiteCommon::View::GraphPackage::Util::rNumericVectorFromArray($pch, 'points.pch');
  my $rFill = $fill ? "TRUE" : "FALSE";

  $nCols = defined($nCols) ? $nCols : 2;

  my $rv = "
 #-------------------------------------------------------------------------------
  screen(screens[screen.i]);
  screen.i <- screen.i + 1;

  $rColorsString
  $rNamesString
  $rPointsPchString

  par(yaxs='i', xaxs='i', xaxt='n', yaxt='n', bty='n', mar=c(0.1,0.1,0.1,0.1));
  plot(c(0),c(0), xlab='', ylab='',type='l',col='orange', xlim=c(0,1),ylim=c(0,1));

  if($rFill) {
    legend(0.5, 0.5,
         legend.names,
         xjust = 0.5,
         yjust = 0.5,
         cex   = 0.9,
         ncol  = $nCols,
         fill=legend.colors,
         bty='n'
        );
  } else {
    legend(0.5, 0.5,
         legend.names,
         xjust = 0.5,
         yjust = 0.5,
         cex   = 0.9,
         pt.cex = 1.5,
         col   = legend.colors,
         pt.bg = legend.colors,
         pch   = points.pch,
         lty   = 'solid',
         ncol  = $nCols,
         bty='n'
        );
  }
";


}

#--------------------------------------------------------------------------------

sub useLegacy {return 0}

sub getSplitScreenInit {
  my ($self) = @_;
  if($self->useLegacy()) {

    return "screens     <- split.screen(screen.dims, erase=T);
screens;
screen.i    <- 1;
";
  }

  return "plotlist = list();
plotlist.i = 1;
";
}


sub getSplitScreenFinish {
  my ($self) = @_;
  if($self->useLegacy()) {

    return "close.screen(all.screens=T);";
  }

  return "multiplot(plotlist = plotlist, cols = 1)";

}



sub makeR {
  my ($self, $rPlotStringsHash) = @_;

  my @rv;

  my $thumb_b   = $self->getThumbnail();

  my $r_f = $self->getOutputFile(). '.R';
  my $r_fh = $self->getFileHandle();
  my $out_f     = $self->getOutputFile();

  push(@rv, $r_f, $out_f);

  my $parts = [];

#  my $legendSize = 1;
 # if($self->getMainLegend()) {
 #   $legendSize = $self->getLegendSize();
 # }

 # push(@$parts, { Name => "_LEGEND",   Size => $legendSize });


  my $profileSetsHash = $self->getProfileSetsHash();

  my $defaultPlotPart = $self->getDefaultPlotPart();

  my $i = 0;
  foreach my $ps (keys %$profileSetsHash) {
    my $sizeFromHash = $profileSetsHash->{$ps}->{size};
    my $size = defined $sizeFromHash ? $sizeFromHash : $self->getScreenSize();

    if(($defaultPlotPart && $i == 0) || !$defaultPlotPart) {
        push(@$parts, { Name => "$ps",   Size => $size});
    }

    $i++;
  }

  my $mS = EbrcWebsiteCommon::View::MultiScreen->new
    ( Parts => $parts,
      VisibleParts => $self->getVisibleParts(),
      VisiblePartsAreFuzzy => $self->getVisiblePartsAreFuzzy(),
      Thumbnail    => $thumb_b
    );

  $self->setMultiScreen($mS);

  my $width       = $self->getPlotWidth();
  my $totalHeight = $mS->totalHeight();
  my $scale       = $self->getScalingFactor();

  $width       *= $scale;
  $totalHeight *= $scale;

  # used in R code to set locations of screens
  my $screens     = $mS->rScreenVectors();
  my $parts_n     = $mS->numberOfVisibleParts();

  my $open_R;

  my $widthOverride = $self->getWidthOverride();
  my $heightOverride = $self->getHeightOverride();


  if($widthOverride && $heightOverride) {
    $open_R = $self->rOpenFile($widthOverride, $heightOverride);
  }
  else {
    $open_R = $self->rOpenFile($width, $totalHeight);
  }

  my $preamble_R  = $self->_rStandardComponents($thumb_b);

  my     $legend = "";

  my %isVis_b = $mS->partIsVisible();

  # Always want _LEGEND available to visible parts
  if($isVis_b{_LEGEND}) {
    $legend = $self->makeRLegendString();
  }

  my @rStrings = @{$self->makeRPlotStrings()};
  my $rStrings = join("\n", @rStrings);

  my $splitScreenInit = $self->getSplitScreenInit();
  my $splitScreenFinish = $self->getSplitScreenFinish();
  my $rcode =  <<RCODE;

# ------------------------------- Prepare --------------------------------

$preamble_R

library(grid);
library(gridExtra);
library(ggplot2);
suppressPackageStartupMessages(library(gridSVG));
library(tools);
library(gtools);
library(plyr);

$open_R

plasmodb.par();

# screen.dimis only used for legacy
screen.dims <- t(array(c($screens),dim=c(4,$parts_n)));
$splitScreenInit

ticks <- function() {
  axis(1, at=seq(x.min, x.max, 1), labels=F, col="gray75");
  axis(1, at=seq(5*floor(x.min/5+0.5), x.max, 5), labels=F, col="gray50");
  axis(1);
}

  customAbbreviate <- function(x) {
    x.1 = gsub("a|e|i|o|u", "", x);
    if(sum(duplicated(x.1)) > 0) {
      return(abbreviate(x));
    }
    return(x.1);
  }

# multiplot only used for ggplot
multiplot <- function(..., plotlist=NULL, file, cols=1, layout=NULL) {

  # Make a list from the ... arguments and plotlist
  plots <- c(list(...), plotlist)

  numPlots = length(plots)

  # If layout is NULL, then use 'cols' to determine layout
  if (is.null(layout)) {
    # Make the panel
    # ncol: Number of columns of plots
    # nrow: Number of rows needed, calculated from # of cols
    layout <- matrix(seq(1, cols * ceiling(numPlots/cols)),
                    ncol = cols, nrow = ceiling(numPlots/cols))
  }

  if (numPlots==1) {
    print(plots[[1]])

  } else {
    # Set up the page
    grid.newpage()
    pushViewport(viewport(layout = grid.layout(nrow(layout), ncol(layout))))

    # Make each plot, in the correct location
    for (i in 1:numPlots) {
      # Get the i,j matrix positions of the regions that contain this subplot
      matchidx <- as.data.frame(which(layout == i, arr.ind = TRUE))

      print(plots[[i]], vp = viewport(layout.pos.row = matchidx\$row,
                                      layout.pos.col = matchidx\$col))
    }
 }
}


#only used for ggplot in the case where legend has more than 9 entries.
#overrides an existing geom supplied as 'real.geom' and forces it to 
#additionally add some text to the grob it creates. this text later becomes a tooltip.

geom_tooltip <- function (mapping = NULL, data = NULL, stat = "identity",
                          position = "identity", real.geom = NULL, ...) {

    #this because geom_histogram is just an alias for geom_bar with stat_bin
    #currently only possible override of stat_bin is stat_count. otherwise, 
    #you should be using geom_bar anyhow.
    if (typeof(real.geom) == "character" && real.geom == "geom_histogram") {
      if (stat == "count") {
        rg <- geom_bar(mapping = mapping, data = data, stat = "count",
                      position = position, ...)
      } else {
        rg <- geom_bar(mapping = mapping, data = data, stat = "bin",
                      position = position, ...)
      }
    } else {
      rg <- real.geom(mapping = mapping, data = data, stat = stat,
                    position = position, ...)
    }
    
    #store the original ggproto object to inherit from as var parent 
    parent=rg\$geom

    if(is.ggproto(parent)){
      #geom_area is handled differently because it relies on draw_group rather than draw panel to 
      #create the grobs that need to be garnished
      if(class(parent)[1]=="GeomArea" || class(parent)[1]=="GeomDensity") {
        rg\$geom <-ggproto(parent, parent,
           draw_group = function(data, panel_scales, coord, na.rm = FALSE) {
             grob <- parent\$draw_group(data, panel_scales, coord, na.rm = FALSE)
             grob <- garnishGrob(grob, onmousemove=paste("showTooltip(evt, '",
                     data[1,]\$tooltip , "')"), onmouseout="hideTooltip(evt)",
                     "pointer-events"="all")
           },
           required_aes = c("tooltip", parent\$required_aes)
         )
      #geom line is handled seperate from segment in order to get the tooltips to match the groups.
      #we must force it to draw each line/ group seperately rather than as one grob
      } else if (class(parent)[1]=="GeomLine") {
        rg\$geom <-ggproto(parent, parent,
          draw_panel = function(self, data, panel_scales, coord,
                         arrow = NULL, lineend = "butt", na.rm = FALSE) {
            groups = unique(data\$group)
            grobs <- list()
            for (i in 1:length(groups)) {
              currGroup = groups[[i]]
              currData = subset(data, data\$group == currGroup)
              grob <- parent\$draw_panel(currData, panel_scales, coord, arrow, lineend)
              grobs[[i]] <- garnishGrob(grob, onmousemove=paste("showTooltip(evt, '",
                       currData[1,]\$tooltip , "')"), onmouseout="hideTooltip(evt)",
                       "pointer-events"="all")
            }
            ggplot2:::ggname("geom_tooltip", gTree(children = do.call("gList", grobs)))
          },
          required_aes = c("tooltip", parent\$required_aes)
         )
      #segment is handled seperately from the standard because the params passed to draw_panel are
      #different
      } else if (class(parent)[1]=="GeomSegment") {
        rg\$geom <-ggproto(parent, parent,
          draw_panel = function(self, data, panel_scales, coord,
                         arrow = NULL, lineend = "butt", na.rm = FALSE) {
            grobs <- list()
            for (i in 1:nrow(data)) {
              grob <- parent\$draw_panel(data[i,], panel_scales, coord, arrow, lineend)
              grobs[[i]] <- garnishGrob(grob, onmousemove=paste("showTooltip(evt, '",
                         data[i,]\$tooltip , "')"), onmouseout="hideTooltip(evt)",
                         "pointer-events"="all")
            }
            ggplot2:::ggname("geom_tooltip", gTree(children = do.call("gList", grobs)))
          },
        required_aes = c("tooltip", parent\$required_aes)
        )
      } else {
        #replace ggproto object with one of our own design. overwrite draw_panel and required_aes.
        rg\$geom <-ggproto(parent, parent,
          draw_panel = function(self, data, panel_scales, coord, width = NULL,
                       na.rm = FALSE) {
            grobs <- list()
            for (i in 1:nrow(data)) {
	      #call draw_panel of the original ggproto object. then garnish the grob it returns
	      #with svg attributes for tooltips
                grob <- parent\$draw_panel(data[i,], panel_scales, coord)
                grobs[[i]] <- garnishGrob(grob, onmousemove=paste("showTooltip(evt, '",
                              data[i,]\$tooltip , "')"), onmouseout="hideTooltip(evt)",
                              "pointer-events"="all")
            }
            #adding our grobs to gtree to be rendered
            ggplot2:::ggname("geom_tooltip", gTree(children = do.call("gList", grobs)))
          },
          #add tooltip to the aesthetics for our ggproto object
          required_aes = c("tooltip", parent\$required_aes)
        )
      }
      rg
    } else {
      stop("Geom layer specified by real.geom is not a known ggplot layer.");
    }
}

#remove rows from a dataframe where a specific column has NA
completeDF <- function(data, desiredCols) {
  completeVec <- complete.cases(data[, desiredCols])
  return(data[completeVec, ])
}


# --------------------------------- Add Legend-------------------------------

$legend

# --------------------------------- Add Plots ------------------------------

$rStrings


# --------------------------------- Done ---------------------------------

$splitScreenFinish

#add some javascript to the svg to make the tooltips functional.
if (grepl(file_ext(\"$out_f\"), \"svg\")) {
    grid.script('var showTooltip = function(evt, label) {
	// Getting rid of any existing tooltips
        hideTooltip();
        var svgNS = "http://www.w3.org/2000/svg";
        var target = evt.currentTarget;
        // Create new text node, rect and text for the tooltip
        var content = document.createTextNode(label);
        var text = document.createElementNS(svgNS, "text");
        text.setAttribute("id", "tooltipText");
        // Resetting some style attributes
        text.setAttribute("font-size", "14px");
        text.setAttribute("font-family", "Helvetica, Arial, FreeSans, Liberation Sans, Nimbus Sans L, sans-serif");
        text.setAttribute("fill", "black");
        text.setAttribute("stroke-width", "0");
        text.appendChild(content);
        var rect = document.createElementNS(svgNS, "rect");
        rect.setAttribute("id", "tooltipRect");
        // Add rect and text to the bottom of the document.
        // This is because SVG has a rendering order.
        // We want the tooltip to be on top, therefore inserting last.
        var wrappingGroup = document.getElementsByTagName("g")[0];
        wrappingGroup.appendChild(rect);
        wrappingGroup.appendChild(text);
        // Transforming the mouse location to the SVG coordinate system
        // Snippet lifted from: http://tech.groups.yahoo.com/group/svg-developers/message/52701
        var m = target.getScreenCTM();
        var p = document.documentElement.createSVGPoint();
        p.x = evt.clientX;
        p.y = evt.clientY;
        p = p.matrixTransform(m.inverse());
        // Determine position for tooltip based on location of 
        // element that mouse is over
        // AND size of text label
        // Currently the tooltip is offset by (3, 3)
        var svgWidth = document.getElementById("gridSVG").getBBox().width;
        var toolWidth = text.getBBox().width;
        var maxX = svgWidth - toolWidth;
	var tooltipx = p.x + 3;
	if (tooltipx > maxX) {
                tooltipx = maxX - 20;
        }
        var tooltiplabx = tooltipx + 5;
        var tooltipy = p.y + 3;
        var tooltiplaby = tooltipy + 5;
        // Position tooltip rect and text
        text.setAttribute("transform",
                "translate(" + tooltiplabx + ", " + tooltiplaby + ") " +
                "scale(1, -1)");
        rect.setAttribute("x", tooltipx);
        rect.setAttribute("y", tooltipy);
        rect.setAttribute("width", text.getBBox().width + 10);
        rect.setAttribute("height", text.getBBox().height + 5);
        rect.setAttribute("stroke", "black");
        rect.setAttribute("fill", "ghostwhite");
	rect.setAttribute("rx", "5");
        rect.setAttribute("ry", "5");
        //rect.setAttribute("fill-opacity", "0.5");
};
var hideTooltip = function() {
        // Remove tooltip text and rect
        var text = document.getElementById("tooltipText");
        var rect = document.getElementById("tooltipRect");
        if (text && rect) {
                text.parentNode.removeChild(text);
                rect.parentNode.removeChild(rect);
        }	
	};');
}

dev.off();
quit(save=\"no\")

RCODE

  print $r_fh $rcode;
#  print STDERR $rcode;

  $r_fh->close();

  my $tempFiles = $self->getTempFiles();

  push @rv, @$tempFiles;


  return @rv;
}

#--------------------------------------------------------------------------------

#TODO: factor out into PlotPart.pm
sub writeProfileFiles {
  my ($self, $profileSetName, $suffix, $elementOrder) = @_;

  my $api = eval
  {
    require ApiCommonWebsite::Model::CannedQuery::ElementNames;
    ApiCommonWebsite::Model::CannedQuery::ElementNames->import();
    require ApiCommonWebsite::Model::CannedQuery::Profile;
    ApiCommonWebsite::Model::CannedQuery::Profile->import();
    require ApiCommonWebsite::Model::CannedQuery::ProfileFixedValue;
    ApiCommonWebsite::Model::CannedQuery::ProfileFixedValue->import();
    1;
  };

  #may eventually have to change this. maybe to add an else for other projects. dunno...
  if ($api) {
    my $_qh   = $self->getQueryHandle();
    my $_dict = {};

    my $r_fh = $self->getFileHandle();
  
    my $defaultProfile;

    if($self->hasGraphDefault()) {
      my $defaultValue = $self->getGraphDefaultValue();

      $defaultProfile = ApiCommonWebsite::Model::CannedQuery::ProfileFixedValue->new
        ( Name         => "_data_$suffix",
          Id           => $self->getId(),
          ProfileSet   => $profileSetName,
          DefaultValue => $defaultValue,
        );
    }


    my $profile = ApiCommonWebsite::Model::CannedQuery::Profile->new
      ( Name         => "_data_$suffix",
        Id           => $self->getId(),
        ProfileSet   => $profileSetName,
      );

    my $elementNames = ApiCommonWebsite::Model::CannedQuery::ElementNames->new
        ( Name         => "_names_$suffix",
          Id           => $self->getId(),
          ProfileSet   => $profileSetName,
        );

    my @profileErrors;
    my @errors;

    $profile->setElementOrder($elementOrder) if($elementOrder);
    $elementNames->setElementOrder($elementOrder) if($elementOrder);
    my $profile_fn = eval { $profile->makeTabFile($_qh, $_dict) }; $@ && push(@profileErrors, $@);
    my $elementNames_fn = eval { $elementNames->makeTabFile($_qh, $_dict) }; $@ && push(@errors, $@);

    #TODO: factor into PlotPart, each PlotPart must be responsible for deleting temp files 
    $self->addTempFile($profile_fn) if($profile_fn);
    $self->addTempFile($elementNames_fn) if($elementNames_fn);

    if(@profileErrors) {
      $profile_fn = eval { $defaultProfile->makeTabFile($_qh, $_dict) }; $@ && push(@errors, $@);
      #TODO: factor into PlotPart, each PlotPart must be responsible for deleting temp files 
      $self->addTempFile($profile_fn) if($profile_fn);
    }

    my @rv = ($profile_fn, $elementNames_fn);

    if (@errors) {
      $self->reportErrorsAndBlankGraph($r_fh, (@profileErrors,@errors));
    }

    return \@rv;
  }
}


#--------------------------------------------------------------------------------

sub addToProfileDataMatrix {
  my ($self, $profileFiles, $elementNamesFiles, $profileSetNames) = @_;

  my $allNames = $self->getAllNames();
  my $allValues = $self->getAllValues();

  for(my $i = 0; $i < scalar @$profileFiles; $i++) {
    my $profileFile = $profileFiles->[$i];
    my $elementNamesFile = $elementNamesFiles->[$i];
    my $profileSet = $profileSetNames->[$i];
    
    next unless ($profileFile && $elementNamesFile);

    open(NAMES, $elementNamesFile) or die "Cannot open file $elementNamesFile for reading:$!";
    open(VALUES, $profileFile) or die "Cannot open file $elementNamesFile for reading:$!";

    my @names = <NAMES>;
    my @values = <VALUES>;

    my %values;
    my $index = 1;

    foreach(@values) {
      chomp $_;
      next if /VALUE/;
      my ($k, $v) = split(/\t/, $_);

      if(defined $v) {
        push @{$values{$k}}, $v;
      } else {
        push @{$values{$index}}, $k;
        $index++;
      }
    }


    my @avgValues = ('Header');

    for(my $i = 1; $i < scalar(keys(%values)) + 1; $i++) {
      my @allValues;
      unless (defined $values{$i}) { 
        @allValues = ('NA') x scalar(@names);
      } else {
        @allValues = @{$values{$i}};
      }

      
      my $sum = 0;
      my $naCount = 0;
      foreach(@allValues) {
        if($_ eq 'NA') {
          $naCount++;
        }
        else {
          $sum += $_;
        }
      }

      

      if($naCount == scalar @allValues) {
        push @avgValues, 'NA';
      }
      else {
        push @avgValues, $sum / (scalar(@allValues) - $naCount);
      }
    }
    my $naCount = 0;
    foreach(@avgValues) {
      if($_ eq 'NA') {
        $naCount++;
      }
    }
    if ($naCount+1 == scalar @avgValues) {
      next;
    }
    unless(scalar @names == scalar @avgValues) {
      die "Element Names file Different length than Values File";
    }

    for(my $j = 1; $j < scalar @names; $j++) {
      my $nameRow = $names[$j];

      chomp $nameRow;

      my ($neo, $name) = split(/\t/, $nameRow);
      my $value = $avgValues[$j];

      my ($digit) = $name =~ /(^\d+)/;
      $digit = -1 unless(defined $digit);

      my $namesHash = {name => $name,
                       digit => $digit,
                       elementOrder => $neo,
                      };

      push @$allNames, $namesHash unless(EbrcWebsiteCommon::View::GraphPackage::Util::isSeen($name, $allNames));

#      my $distinctProfileSet = $i > 0 ? $profileSet . "_" . $i : $profileSet;

      $allValues->{$profileSet}->{$name} = $value;
    }


    close NAMES;
    close VALUES;
  }

}

#--------------------------------------------------------------------------------

sub makeHtmlStringFromMatrix {
  my ($self) = @_;

  my $allNames = $self->getAllNames();
  my $allValues = $self->getAllValues();

  my $outputFile = $self->getOutputFile();
  open(OUT, ">> $outputFile") or die "Cannot open file $outputFile for writing: $!";

  my @sortedNames = map { $_->{name} } sort{$a->{digit} <=> $b->{digit} || $a->{elementOrder} <=> $b->{elementOrder}} @$allNames;

  print OUT "<table border=1>\n  <thead><tr><th>Experiment/Sample</th>\n";

  my @values;

  my @profileSets = sort keys %$allValues;

    print OUT join("\n", map{ "    <th>$_</th>"} @profileSets);
    print OUT "  </tr></thead>\n";

  foreach my $elementName (@sortedNames) {
      print OUT "  <tr>\n";
      print OUT "  <td>$elementName</td>\n";

    foreach my $profileSet (@profileSets) {
      my $val = $allValues->{$profileSet}->{$elementName};

      $val = defined $val && $val ne 'NA' ? sprintf("%.3f", $val) : "NA";

      print OUT "  <td>$val</td>\n";
    }
      print OUT "  </tr>\n";
  }


  print OUT "</table>\n<br/><br/>";

  close OUT;
}




#--------------------------------------------------------------------------------





1;
