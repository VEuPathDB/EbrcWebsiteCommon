package EbrcWebsiteCommon::View::GraphPackage::PlotPart;

use strict;
use vars qw( @ISA );

use Data::Dumper;

@ISA = qw( EbrcWebsiteCommon::View::GraphPackage );
use EbrcWebsiteCommon::View::GraphPackage;
use EbrcWebsiteCommon::View::GraphPackage::Util;

use File::Copy;
use Data::Dumper;

#----------------------------------------------------------------------------------------------

sub getProfileSets               { $_[0]->{'_profile_sets'                  }}
sub setProfileSets               { $_[0]->{'_profile_sets'                  } = $_[1]}

sub getPartName                  { $_[0]->{'_part_name'                     }}
sub setPartName                  { $_[0]->{'_part_name'                     } = $_[1]}

sub getYaxisLabel                { $_[0]->{'_y_axis_label'                  }}
sub setYaxisLabel                { $_[0]->{'_y_axis_label'                  } = $_[1]}

sub getColors                    { $_[0]->{'_colors'                        }}
sub setColors                    { $_[0]->{'_colors'                        } = $_[1]}

sub getIsLogged                  { $_[0]->{'_is_logged'                     }}
sub setIsLogged                  { $_[0]->{'_is_logged'                     } = $_[1]}

sub getPlotTitle                 { $_[0]->{'_plot_title'                    }}
sub setPlotTitle                 { $_[0]->{'_plot_title'                    } = $_[1]}

sub getMakeYAxisFoldInduction    { $_[0]->{'_make_y_axis_fold_induction'    }}
sub setMakeYAxisFoldInduction    { $_[0]->{'_make_y_axis_fold_induction'    } = $_[1]}

sub getAdjustProfile             { $_[0]->{'_r_adjust_profile'              }}
sub setAdjustProfile             { $_[0]->{'_r_adjust_profile'              } = $_[1]}
sub addAdjustProfile {
  my ($self, $ap) = @_;

  my $existing = $self->getAdjustProfile();

  if($ap) {
    $self->setAdjustProfile($existing . $ap);
  }
}

sub getDefaultYMax               { $_[0]->{'_default_y_max'                 }}
sub setDefaultYMax               { $_[0]->{'_default_y_max'                 } = $_[1]}

sub getDefaultYMin               { $_[0]->{'_default_y_min'                 }}
sub setDefaultYMin               { $_[0]->{'_default_y_min'                 } = $_[1]}

sub getSampleLabels               { $_[0]->{'_sample_labels'                }}
sub setSampleLabels               { $_[0]->{'_sample_labels'                } = $_[1]}

sub getRPostscript               { $_[0]->{'_r_postscript'                  }}
sub setRPostscript               { $_[0]->{'_r_postscript'                  } = $_[1]}

sub getFillBelowLine	 	 { $_[0]->{'_fill_below_line'		    }}
sub setFillBelowLine		 { $_[0]->{'_fill_below_line'		    } = $_[1]}

sub getRemoveNaN                 { $_[0]->{'_remove_nan'                    }}
sub setRemoveNaN                 { $_[0]->{'_remove_nan'                    } = $_[1]}

#----------------------------------------------------------------------------------------------

sub getScreenSize                { $_[0]->{'_screen_size'                   }}
sub setScreenSize                { $_[0]->{'_screen_size'                   } = $_[1]}

sub getElementNameMarginSize     { $_[0]->{'_element_name_margin_size'      }}
sub setElementNameMarginSize     { $_[0]->{'_element_name_margin_size'      } = $_[1]}

sub getErrorsFileHandle          { $_[0]->{'_file_handle'                   }}

sub getHasExtraLegend            { $_[0]->{'_has_extra_legend'              }}
sub setHasExtraLegend            { $_[0]->{'_has_extra_legend'              } = $_[1]}

sub getLegendColors              { $_[0]->{'_legend_colors'                 }}
sub setLegendColors              { $_[0]->{'_legend_colors'                 } = $_[1]}

sub getExtraLegendSize           { $_[0]->{'_extra_legend_size'             }}
sub setExtraLegendSize           { $_[0]->{'_extra_legend_size'             } = $_[1]}

sub getTitleLine                 { $_[0]->{'_title_line'                    }}
sub setTitleLine                 { $_[0]->{'_title_line'                    } = $_[1]}

sub isCompact                    { $_[0]->{'_is_compact'                    }}
sub setIsCompact                 { $_[0]->{'_is_compact'                    } = $_[1]}

sub getLegendLabels              { $_[0]->{'_legend_labels'                 }}
sub setLegendLabels              { $_[0]->{'_legend_labels'                 } = $_[1]}

sub getProfileTypes              { $_[0]->{'_profile_types'                 }}
sub setProfileTypes              { $_[0]->{'_profile_types'                 } = $_[1]}

sub getFacet                     { $_[0]->{'_facet'                         }}
sub setFacet                     { $_[0]->{'_facet'                         } = $_[1]}

sub getHideXAxisLabels           { $_[0]->{'_x_axis_labels'                 }}
sub setHideXAxisLabels           { $_[0]->{'_x_axis_labels'                 } = $_[1]}

sub getContXAxis                 { $_[0]->{'_cont_x_axis'                   }}
sub setContXAxis                 { $_[0]->{'_cont_x_axis'                   } = $_[1]}

sub getYAxis                     { $_[0]->{'_y_axis'                        }}
sub setYAxis                     { $_[0]->{'_y_axis'                        } = $_[1]}

sub getTest                      { $_[0]->{'_test'                          }}
sub setTest                      { $_[0]->{'_test'                          } = $_[1]}

sub getEventStart                { $_[0]->{'_event_start'                   }}
sub setEventStart                { $_[0]->{'_event_start'                   } = $_[1]}

sub getEventDur                  { $_[0]->{'_event_dur'                     }}
sub setEventDur                  { $_[0]->{'_event_dur'                     } = $_[1]}


#----------------------------------------------------------------------------------------------

sub new {
  my $class = shift;

  my $self = $class->SUPER::new(@_);

  my $id = $self->getId();

  #Setting Defaults
  $self->setScreenSize(250);
  $self->setElementNameMarginSize(3);
  $self->setYaxisLabel('Please Fill in Y-Axis Label');
  $self->setDefaultYMax(10);
  $self->setDefaultYMin(0);
  $self->setColors(["#000099"]);
  $self->setExtraLegendSize(4.5);

  $self->setTitleLine(0.5);

  $self->setPlotTitle($id);

  $self->setSampleLabels([]);

   return $self;
}

#----------------------------------------------------------------------------------------------

sub makeFilesForR {
  my ($self, $idType) = @_;

  my $part = $self->getPartName();
  my $profileSampleLabels = $self->getSampleLabels();

  my $profileSets = $self->getProfileSets();
  my $id = $self->getId();
  my $qh = $self->getQueryHandle();

  for(my $i = 0; $i < scalar @$profileSets; $i++) {
    my $profileSet = $profileSets->[$i];
    my $suffix = $part . $i;
    $profileSet->writeFiles($id, $qh, $suffix, $idType);
    my $errors = $profileSet->errors();
    if (scalar @$errors > 0) {
      unless ($errors->[0] =~ /no rows returned for query/) {
        die "Unable to query values from the database: \n $errors";
      }
    }
  }

  return $self->profileFilesAsRVectors($profileSets);
}

sub profileFilesAsRVectors {
  my ($self, $profileSets) = @_;

  my @profileFiles = map { $_->getProfileFile() } @$profileSets;
  my @elementNamesFiles = map { $_->getElementNamesFile() } @$profileSets;

  my @stderrProfileSets = map { $_->getRelatedProfileSet() } @$profileSets;
  my @stderrFiles = map { $_->getProfileFile() if($_) } @stderrProfileSets;

  my $profileFilesString = EbrcWebsiteCommon::View::GraphPackage::Util::rStringVectorFromArray(\@profileFiles, 'profile.files');
  my $elementNamesString = EbrcWebsiteCommon::View::GraphPackage::Util::rStringVectorFromArray(\@elementNamesFiles, 'element.names.files');
  my $stderrString = EbrcWebsiteCommon::View::GraphPackage::Util::rStringVectorFromArray(\@stderrFiles, 'stderr.files');
  my $backUp = $elementNamesFiles[0];

#  print STDERR Dumper \@profileFiles;
#  print STDERR Dumper \@elementNamesFiles;
#  print STDERR Dumper \@stderrFiles;

  return($profileFilesString, $elementNamesString, $stderrString);

}

sub blankPlotPart {
my ($self)= @_;
my $plotTitle = $self->getPlotTitle();

my $text = "None";
my $cex = 5;

if($self->isCompact()) {
  $text = $self->getId();
  $cex = 0.9;
}

return <<DummyR


screen(screens[screen.i]);
screen.i <- screen.i + 1;

par(yaxs="i", xaxs="i", xaxt="n", yaxt="n", bty="n");

plot(c(0),c(0), xlab='', ylab='',type="l",col="orange", xlim=c(0,1),ylim=c(0,1));
text(0.5, 0.5, "$text",col="black",cex=$cex);

plasmodb.title(\"$plotTitle\");

DummyR

}

sub blankGGPlotPart {
my ($self)= @_;
my $plotTitle = $self->getPlotTitle();

my $text = "None";

if($self->isCompact()) {
  $text = $self->getId();
}

return <<DummyR

d=data.frame(VALUE=0.5, LABEL="None")

gp = ggplot() + geom_blank() + geom_text(data=d, mapping=aes(x=VALUE, y=VALUE, label=LABEL), size=10) + theme_void() + theme(legend.position=\"none\");

plotlist[[plotlist.i]] = gp;
plotlist.i = plotlist.i + 1;



DummyR

}




1;
