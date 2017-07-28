
package EbrcWebsiteCommon::View::GraphPackage::BasicBarPlot;

=pod

=head1 Summary

Makes a bar plot with error bars from replicates.

=cut

# ========================================================================
# ----------------------------- Declarations -----------------------------
# ========================================================================

use strict;
use vars qw( @ISA );

@ISA = qw( EbrcWebsiteCommon::View::GraphPackage );

use EbrcWebsiteCommon::View::GraphPackage;
use EbrcWebsiteCommon::View::MultiScreen;
use EbrcWebsiteCommon::Model::CannedQuery::Profile;
use Time::HiRes qw ( time );

# ========================================================================
# ----------------------- Create, Init, and Access -----------------------
# ========================================================================

# --------------------------------- init ---------------------------------

sub init {
   my $Self = shift;
   my $Args = ref $_[0] ? shift : {@_};

   $Self->SUPER::init($Args);

   # Defaults
   $Self->{YMin} = -1;
   $Self->{YMax} = 1;

   $Self->setNamesQuery           ( $Args->{NamesQuery} );
   $Self->setDataQuery            ( $Args->{DataQuery } );
   $Self->setYaxisLabel           ( $Args->{YaxisLabel          } );
   $Self->setColors               ( $Args->{Colors              } );
   $Self->setTagRx                ( $Args->{TagRx               } );

   return $Self;
}

# ------------------------------ Accessors -------------------------------

sub getNamesQuery           { $_[0]->{'NamesQuery'        } }
sub setNamesQuery           { $_[0]->{'NamesQuery'        } = $_[1]; $_[0] }

sub getDataQuery            { $_[0]->{'DataQuery'         } }
sub setDataQuery            { $_[0]->{'DataQuery'         } = $_[1]; $_[0] }

sub getYaxisLabel           { $_[0]->{'YaxisLabel'        } }
sub setYaxisLabel           { $_[0]->{'YaxisLabel'        } = $_[1]; $_[0] }

sub getColors               { $_[0]->{'Colors'            } }
sub setColors               { $_[0]->{'Colors'            } = $_[1]; $_[0] }

sub getTagRx                { $_[0]->{'TagRx'             } }
sub setTagRx                { $_[0]->{'TagRx'             } = $_[1]; $_[0] }

sub getYScaleFactor         { $_[0]->{'YScaleFactor'      } }
sub setYScaleFactor         { $_[0]->{'YScaleFactor'      } = $_[1]; $_[0] }

sub getYMin                 { $_[0]->{'YMin'              } }
sub setYMin                 { $_[0]->{'YMin'              } = $_[1]; $_[0] }

sub getYMax                 { $_[0]->{'YMax'              } }
sub setYMax                 { $_[0]->{'YMax'              } = $_[1]; $_[0] }

# ========================================================================
# ------------------------------- Methods --------------------------------
# ========================================================================

sub makeR {
   my $Self = shift;

   my @Rv;

   my $yMax = $Self->getYMax();
   my $yMin = $Self->getYMin();

   my $id = $Self->getId();

   my $_qh   = $Self->getQueryHandle();
   my $_dict = {};

   my $thumb_b   = $Self->getThumbnail();

   my $fmt       = $Self->getFormat();
   my $r_f       = $Self->getOutputFile(). '.R';
   my $out_f     = $Self->getOutputFile();

   my $r_fh = FileHandle->new(">$r_f") ||
   die "Can not open R file '$r_f': $!";

   my @errors = ();

   my $_names = eval { $Self->getNamesQuery()->getValues($_qh, $_dict) }; $@ && push(@errors, $@);
   my $_data  = eval { $Self->getDataQuery ()->getValues($_qh, $_dict) }; $@ && push(@errors, $@);

   if (@errors) {
      $Self->reportErrorsAndBlankGraph($r_fh, @errors);
   }

   else {

      # data we need to get for plot
      my @tags;
      my @avg;
      my @std;

      # do we need to extract a tag from replicate info?
      if (my $_rx = $Self->getTagRx()) {

         # [i] = tag for statistics
         my @group_dict;

         # { } = 
         my %tag_dict;

         # consider each name
         for (my $i = 0; $i < @$_names; $i++) {
            my $eo_i = $_names->[$i]->{ELEMENT_ORDER};
            my $name = $_names->[$i]->{NAME};
            my ($tag, $rep) = $name =~ /$_rx/;#/(.+)\s+(rep\d+)$/;
            $group_dict[$eo_i] = $tag;
            $tag_dict{$tag} = 1;
         }
         @tags = sort keys %tag_dict;

         # {tag} = [ data ]
         my %data_dict;

         # {tag} = average
         my %avg_dict;

         # {tag} = stddev
         my $std_dict;

         foreach my $_datum (@$_data) {
            my $tag = $group_dict[$_datum->{ELEMENT_ORDER}];
            push(@{$data_dict{$tag}}, $_datum->{VALUE});
         }

         for (my $i = 0; $i < @tags; $i++) {
            $avg[$i] = CBIL::Util::V::average(@{$data_dict{$tags[$i]}});
            $std[$i] = sqrt(CBIL::Util::V::variance(@{$data_dict{$tags[$i]}}));
         }
      }

      # take the data as it is
      else {
         @tags = map { $_->{NAME}  } sort { $a->{ELEMENT_ORDER} <=> $b->{ELEMENT_ORDER} } @$_names;
         @avg  = map { $_->{VALUE} } sort { $a->{ELEMENT_ORDER} <=> $b->{ELEMENT_ORDER} } @$_data;
         @std  = (0) x scalar @tags;
      }

      if(my $factor = $Self->getYScaleFactor()) {
        @avg = map {$_ * $factor} @avg;
      }


      my $tags_n = scalar @tags;

      my $tags   = join(', ', map { "'$_'" } @tags);
      my $avg    = join(', ', @avg);
      my $std    = join(', ', @std);
      my $colors = join(', ', map { $_ =~ /\(/ ? $_ : "'$_'" } @{$Self->getColors()});
      my $ylab   = $Self->getYaxisLabel();

      #print STDERR "STD=$std\n";
      #print STDERR "AVG=$avg\n";

      my $_mS = EbrcWebsiteCommon::View::MultiScreen->new
      ( Parts => [ { Name => 'hist',   Size => 275 },
                 ],
        VisibleParts => $Self->getVisibleParts(),
        Thumbnail    => $thumb_b
      );

      # used in R code to branch
      my %isVis_b     = $_mS->partIsVisible();

      my $width       = CBIL::Util::V::min(600, $tags_n * 40 + 60);
      my $totalHeight = $_mS->totalHeight();
      if ($thumb_b) {
         $width       *= 0.75;
         $totalHeight *= 0.75;
      }

      # used in R code to set locations of screens
      my $screens     = $_mS->rScreenVectors();
      my $parts_n     = $_mS->numberOfVisibleParts();

      my $open_R      = $Self->rOpenFile($width, $totalHeight);
      my $preamble_R  = $Self->_rStandardComponents($thumb_b);

      print $r_fh <<R;

# ------------------------------- Prepare --------------------------------

$preamble_R

# ---------------------------- Load Data Sets ----------------------------

the.tags        <- c($tags);
the.avg         <- c($avg);
the.std         <- c($std);
the.colors      <- c($colors);

# --------------------------- Prepare To Plot ----------------------------

$open_R;

plasmodb.par();

screen.dims <- t(array(c($screens),dim=c(4,$parts_n)));
screens     <- split.screen(screen.dims, erase=T);
screens;
screen.i    <- 1;

ticks <- function() {
  axis(1, at=seq(x.min, x.max, 1), labels=F, col="gray75");
  axis(1, at=seq(5*floor(x.min/5+0.5), x.max, 5), labels=F, col="gray50");
  axis(1);
}

# -------------------- SCREEN 2 : Histogram Data Plot --------------------

if ($isVis_b{hist} == 1) {
  screen(screens[screen.i]);
  screen.i <- screen.i + 1;

  par(mar       = c(8,4,1,1));

  d.min = min(1.1 * (the.avg - the.std), 0);
  d.max = max(1.1 * (the.avg + the.std), 0);

  d.min.default = $yMin;
  d.max.default = $yMax;

  if(d.min > d.min.default) {
    d.min = d.min.default;
  }

  if(d.max < d.max.default) {
    d.max = d.max.default;
  }

  par(mar       = c(10,4, 2, 0) + 0.1, xpd=TRUE);

  c <- barplot(the.avg,
               names.arg = the.tags,
               col       = the.colors,
               ylab      = '$ylab',
               ylim      = c(d.min, d.max),
               las       = 2
              );

  # the suppressWarnings hides complaints about zero-length arrows
  suppressWarnings( arrows(c, the.avg - the.std, c, the.avg+the.std,
                           col="black",
                           lw=2,
                           angle=90,
                           code=3,
                           length=0.05
                           )
                   );
  box();
}

# --------------------------------- Done ---------------------------------

close.screen(all.screens=T);
dev.off();
quit(save="no")

R

   }

   $r_fh->close();

   push(@Rv, $r_f, $out_f );

   return @Rv;
}

# ========================================================================
# ---------------------------- End of Package ----------------------------
# ========================================================================

1;
