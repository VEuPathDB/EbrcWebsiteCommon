package EbrcWebsiteCommon::View::GraphPackage;

# ========================================================================
# ----------------------------- Declarations -----------------------------
# ========================================================================

use strict;

use constant EmailEnabled => 0;
use Time::HiRes qw ( time );

# ========================================================================
# --------------------- Create, Init, and Accessors ----------------------
# ========================================================================

# --------------------------------- new ----------------------------------

sub new {
   my ($class, $argsRef) = @_;

   $argsRef = ref $argsRef ? $argsRef : {};

   my %args;

   foreach(keys %$argsRef) {
     $args{$_} = $argsRef->{$_};
   }

   my $Self = bless \%args, $class;

   $Self->init(\%args);

   return $Self;
}

# --------------------------------- init ---------------------------------

sub init {
   my $Self = shift;
   my $Args = ref $_[0] ? shift : {@_};

   $Self->setName                 ( $Args->{Name                 } );
   $Self->setQueryHandle          ( $Args->{QueryHandle          } );
   $Self->setFormat               ( $Args->{Format               } );
   $Self->setContXAxis            ( $Args->{ContXAxis            } );
   $Self->setStatus               ( $Args->{Status               } );
   $Self->setOptStatus            ( $Args->{OptStatus            } );
   $Self->setYAxis                ( $Args->{YAxis                } );
   $Self->setEventStart           ( $Args->{EventStart           } );
   $Self->setEventDur             ( $Args->{EventDur             } );
   $Self->setOutputFile           ( $Args->{OutputFile           } );
   $Self->setId                   ( $Args->{Id                   } );
   $Self->setThumbnail            ( $Args->{Thumbnail            } );
   $Self->setDefaultPlotPart      ( $Args->{DefaultPlotPart      } );
 
   $Self->setVisibleParts         ( $Args->{VisibleParts         } );

   $Self->setFacets               ( $Args->{Facets               } );
   $Self->setVisiblePartsAreFuzzy ( $Args->{VisiblePartsAreFuzzy } );
   $Self->setSecondaryId          ( $Args->{SecondaryId          } );
   $Self->setDatasetId            ( $Args->{DatasetId            } );
   $Self->setWantLogged           ( $Args->{WantLogged           } );

   $Self->setWidthOverride        ( $Args->{WidthOverride        } );
   $Self->setHeightOverride       ( $Args->{HeightOverride       } );
   $Self->setCompact              ( $Args->{Compact              } );
   $Self->setIdType               ( $Args->{IdType               } );

   my $Thumb = $Self->getThumbnail();

   my $thumbSF = 0.62;

   my $scalingFactor =  $Thumb ? $thumbSF : 1.0;
   $Self->setScalingFactor( $scalingFactor );   

   return $Self;
}

# ------------------------------ accessors -------------------------------

sub getName                    { $_[0]->{'Name'                        } }
sub setName                    { $_[0]->{'Name'                        } = $_[1]; $_[0] }

sub getQueryHandle             { $_[0]->{'QueryHandle'                 } }
sub setQueryHandle             { $_[0]->{'QueryHandle'                 } = $_[1]; $_[0] }

sub getFormat                  { $_[0]->{'Format'                      } }
sub setFormat                  { $_[0]->{'Format'                      } = $_[1]; $_[0] }

sub getOutputFile              { $_[0]->{'OutputFile'                  } }
sub setOutputFile              { $_[0]->{'OutputFile'                  } = $_[1]; $_[0] }

sub getId                      { $_[0]->{'Id'                          } }
sub setId                      { $_[0]->{'Id'                          } = $_[1]; $_[0] }

sub getThumbnail               { $_[0]->{'Thumbnail'                   } }
sub setThumbnail               { $_[0]->{'Thumbnail'                   } = $_[1]; $_[0] }

sub getDefaultPlotPart         { $_[0]->{'DefaultPlotPart'             } }
sub setDefaultPlotPart         { $_[0]->{'DefaultPlotPart'             } = $_[1]; $_[0] }

sub getScalingFactor           { $_[0]->{'ScalingFactor'               } }
sub setScalingFactor           { $_[0]->{'ScalingFactor'               } = $_[1]; $_[0] }

sub getVisibleParts            { $_[0]->{'VisibleParts'                } }
sub setVisibleParts            { $_[0]->{'VisibleParts'                } = $_[1]; $_[0] }

sub getFacets                  { $_[0]->{'Facets'                      } }
sub setFacets                  { $_[0]->{'Facets'                      } = $_[1]; $_[0] }

sub getContXAxis               { $_[0]->{'ContXAxis'                   } }
sub setContXAxis               { $_[0]->{'ContXAxis'                   } = $_[1]; $_[0] }

sub getYAxis                   { $_[0]->{'YAxis'                       } }
sub setYAxis                   { $_[0]->{'YAxis'                       } = $_[1]; $_[0] }

sub getStatus                  { $_[0]->{'Status'                      } }
sub setStatus                  { $_[0]->{'Status'                      } = $_[1]; $_[0] }

sub getOptStatus               { $_[0]->{'OptStatus'                   } }
sub setOptStatus               { $_[0]->{'OptStatus'                   } = $_[1]; $_[0] }

sub getEventStart              { $_[0]->{'EventStart'                  } }
sub setEventStart              { $_[0]->{'EventStart'                  } = $_[1]; $_[0] }

sub getEventDur                { $_[0]->{'EventDur'                    } }
sub setEventDur                { $_[0]->{'EventDur'                    } = $_[1]; $_[0] }

sub getVisiblePartsAreFuzzy    { $_[0]->{'VisiblePartsAreFuzzy'        } }
sub setVisiblePartsAreFuzzy    { $_[0]->{'VisiblePartsAreFuzzy'        } = $_[1]; $_[0] }

sub getSecondaryId             { $_[0]->{'SecondaryId'                 } }
sub setSecondaryId             { $_[0]->{'SecondaryId'                 } = $_[1]; $_[0] }

sub getDatasetId               { $_[0]->{'DatasetId'                   } }
sub setDatasetId               { $_[0]->{'DatasetId'                   } = $_[1]; $_[0] }

sub getWantLogged              { $_[0]->{'WantLogged'                  } }
sub setWantLogged              { $_[0]->{'WantLogged'                  } = $_[1]; $_[0] }

sub getDataPlotterArg          { $_[0]->{'dataPlotterArg'              } }
sub getTypeArg                 { $_[0]->{'dataPlotterArg'              } }
sub setDataPlotterArg          { $_[0]->{'dataPlotterArg'              } = $_[1]; $_[0] }


sub getWidthOverride           { $_[0]->{'WidthOverride'               } }
sub setWidthOverride           { $_[0]->{'WidthOverride'               } = $_[1]; $_[0] }

sub getHeightOverride          { $_[0]->{'HeightOverride'              } }
sub setHeightOverride          { $_[0]->{'HeightOverride'              } = $_[1]; $_[0] }

sub getCompact                 { $_[0]->{'Compact'                     } }
sub setCompact                 { $_[0]->{'Compact'                     } = $_[1]; $_[0] }

sub getIdType                  { $_[0]->{'IdType'                      } }
sub setIdType                  { $_[0]->{'IdType'                      } = $_[1]; $_[0] }


sub declareParts {
  return "";
}


# ========================================================================
# ---------------------------- Object Methods ----------------------------
# ========================================================================

# --------------------------------- run ----------------------------------

=pod

=head1 Running

Running is fairly simple.  The target Id is passed to all
C<CannedQuery>s that need it.  Next the R code (and any other needed
files are generated).  The R is executed with STDOUT passed to STDERR.
Finally the names of all files generated in the process are returned
to the caller who is responsible for deleted them.

=cut

sub run {
   my $Self = shift;

   my @Rv;

	 $Self->pushIds();
   #my $prep_t   = time();
	 @Rv = my ($r_f, @others_f) = $Self->makeR();
   #print STDERR join("\t", 'SQL', time() - $prep_t), "\n";

   my $rProg = defined $ENV{R_PROGRAM} ? $ENV{R_PROGRAM} : 'R';

   unless($Self->getFormat() eq 'table') {
     #my $rvs_t   = time();
     system "$rProg --vanilla --slave < $r_f >/dev/null";
     #print STDERR join("\t", 'RVS', time() - $rvs_t), "\n";
 }

   return @Rv;
}

# ------------------------------- pushIds --------------------------------

=pod

=head2 Pushing Ids

Since not every C<CannedQuery> (subclass) needs an Id, C<GraphPackage>
pokes around in it innards to see which attributes are C<CannedQuery>s
and will accept an Id, then passes its Id to them.  C<SecondaryId> is
handled in a similar way.

=cut

sub pushIds {
	 my $Self = shift;

	 foreach my $key (keys %$Self) {
			my $_attr = $Self->{$key};
			if (ref $_attr &&
					UNIVERSAL::isa($_attr, 'ApiCommonWebsite::Model::CannedQuery'))
      {
         if ($_attr->can('setId')) {
            $_attr->setId($Self->getId());
         }

         if ($_attr->can('setSecondaryId')) {
            $_attr->setSecondaryId($Self->getSecondaryId());
         }
			}
	 }

	 return $Self
}

# ========================================================================
# --------------------------- Generate R Code ----------------------------
# ========================================================================

# ------------------------------ rOpenFile -------------------------------

sub useLegacy {return 0;}

sub rOpenFile {
	 my $Self   = shift;
	 my $Width  = shift;
	 my $Height = shift;

	 my $Rv;

	 my $out_f = $Self->getOutputFile();
	 my $fmt   = $Self->getFormat();

	 my $w     = int($fmt eq 'pdf' || $fmt eq 'svg' ? $Width  / 72 : $Width);
	 my $h     = int($fmt eq 'pdf' || $fmt eq 'svg' ? $Height / 72 : $Height);

	 if(lc($fmt) eq 'pdf') {
           $Rv = qq{pdf(file="$out_f", width=$w, height=$h)};
         }
         elsif(lc($fmt) eq 'png') {
           $Rv = qq{png(file="$out_f", width=$w, height=$h)};
         }

         elsif(lc($fmt) eq 'jpeg') {
           $Rv = qq{jpeg(file="$out_f", width=$w, height=$h)};
         }
         elsif(lc($fmt) eq 'table') {
           # do nothing 
         }
	 elsif(lc($fmt) eq 'svg') {
	   if($Self->useLegacy()){
	     $Rv = qq{svg(file="$out_f", width=$w, height=$h)};
	   }else{
	     $Rv = qq{gridsvg(name="$out_f", width=$w, height=$h)};
	   }
	 }
         else {
           die "Unsupported Format $fmt";
         }

	 return $Rv;
}

# ------------------------- _rStandardComponents -------------------------

sub _rStandardComponents {
   my $Self = shift;
   $Self->_rPreamble(@_)
}

sub _rPreamble {
   my $Self  = shift;
   my $Thumb = shift;

   my $scale = $Self->getScalingFactor;

   my $Rv = <<StandardComponents;

# -------------------------------- colors --------------------------------

options(warn=-1);

plasmodb.pct.color   <- rgb(0.4, 0.4, 0.8);

plasmodb.title.color <- rgb(0.75, 0.00, 0.00);

plasmodb.ring.color        <- rgb(1,0.5,0.5);
plasmodb.schizont.color    <- rgb(0.5,0.5,1.0);
plasmodb.trophozoite.color <- rgb(1.0,0.5,1.0);

# -------------------------------- titles --------------------------------

plasmodb.title <- function ( title.string, line=0.5 ) {
  title(title.string, font.main = 2, col.main = plasmodb.title.color, adj=0, line=line);
}

# ----------------------------- plot margins -----------------------------

plasmodb.par   <- function ( ... ) {


  par(mar      = c(0,0,0,0),
      cex      = $scale,
      cex.main = 1.00,
      cex.lab  = 1.14,
      cex.axis = 1.00,
      las      = 1,
      ...
     );
}
plasmodb.par.last <- function () {
   par(mar     = c(0,0,0,0)
      );
}

# ------------------------ complete set of ticks -------------------------

plasmodb.ticks <- function (axis.index, axis.min, axis.max, axis.gap ) {
#  axis(axis.index);
  axis(axis.index, at=seq( axis.min, axis.max, 1), labels=F, col="gray75");
  axis(axis.index,
       at     = seq( axis.gap*floor(axis.min/axis.gap + 0.5), axis.max, axis.gap),
       labels = F,
       col    = "gray50"
      );
}

plasmodb.grid <- function (...) {
  grid(col="gray75", ... );
}

# ----------------------------- filled plots -----------------------------

plasmodb.filled.plot <- function ( x.data, y.data, ... ) {
  polygon( c( x.data[1], x.data, x.data[length(x.data)]),
           c( 0,         y.data, 0),
           ...
         );
}

StandardComponents

   return $Rv;
}

# ---------------------- reportErrorsAndBlankGraph -----------------------

sub reportErrorsAndBlankGraph {
   my $Self   = shift;
   my $Rfh    = shift;
   my @Errors = @_;

   EmailEnabled && $Self->sendErrorReportEmail($Self, @Errors);


   print STDERR @Errors;
   # write R code to file
   # ........................................

   my $open_R     = $Self->rOpenFile(100,100);
   my $preamble_R = $Self->_rPreamble();

   print $Rfh <<DummyR

$preamble_R
$open_R
#par(yaxs="i", xaxs="i", xaxt="n", yaxt="n", mar=c(0.1,0.1,0.1,0.1));
#plot(c(0,1,1,0),c(0,1,0,1), xlab='', ylab='',type="l",col="orange");
#text(0.5, 0.5, "no plot");
par(yaxs="i", xaxs="i", xaxt="n", yaxt="n", bty="n", mar=c(0.1,0.1,0.1,0.1));
plot(c(0),c(0), xlab='', ylab='',type="l",col="orange", xlim=c(0,1),ylim=c(0,1));
text(0.5, 0.5, "none",col="black",cex=1.0);
dev.off();
quit(save="no")

DummyR

}

# ------------------------- sendErrorReportEmail -------------------------

sub sendErrorReportEmail {
   my $Self   = shift;
   my @Errors = @_;

   my $class = ref $Self;
   my $name  = $Self->getName() || '';
   my $id    = $Self->getId() || '';

   my $mail_fh = FileHandle->new("|mail -s '$class Error for $id' -c '' help\@plasmodb.org")
   || die "Can not open mail for sending: $!";

   print $mail_fh <<Preamble;

Errors were encountered marshalling data for plot called '$name' for ID='$id'.

Preamble

   print $mail_fh join("\n", @Errors), "\n";

   $mail_fh->close();

   return $Self;
}


# ========================================================================
# ---------------------------- End of Package ----------------------------
# ========================================================================

1;

