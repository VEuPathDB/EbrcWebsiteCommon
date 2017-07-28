
package EbrcWebsiteCommon::View::MultiScreen;

=pod

=head1 Purpose

=cut

# ========================================================================
# ----------------------------- Declarations -----------------------------
# ========================================================================

use strict;

use CBIL::Util::V;

# ========================================================================
# ---------------------------- Public Methods ----------------------------
# ========================================================================

# --------------------------------- new ----------------------------------

sub new {
   my $Class = shift;

   my $Self = bless {}, $Class;

   $Self->init(@_);

   return $Self;
}

# --------------------------------- init ---------------------------------

sub init {
   my $Self = shift;
   my $Args = ref $_[0] ? shift : {@_};

   $Self->setParts                ( $Args->{Parts               } );
   $Self->setVisibleParts         ( $Args->{VisibleParts        } );
   $Self->setVisiblePartsAreFuzzy         ( $Args->{VisiblePartsAreFuzzy        } );
   $Self->setThumbnail            ( $Args->{Thumbnail           } );

   $Self->applyFuzzyVisibleParts();
   $Self->applyVisiblePartsDefaults();

   return $Self;
}

# ------------------------------ accessors -------------------------------

sub getParts                { $_[0]->{'Parts'                       } || [] }
sub setParts                { $_[0]->{'Parts'                       } = $_[1]; $_[0] }

sub getVisibleParts         { $_[0]->{'VisibleParts'                } || [] }
sub setVisibleParts         { $_[0]->{'VisibleParts'                } = $_[1]; $_[0] }

sub getVisiblePartsAreFuzzy         { $_[0]->{'VisiblePartsAreFuzzy'                } }
sub setVisiblePartsAreFuzzy         { $_[0]->{'VisiblePartsAreFuzzy'                } = $_[1]; $_[0] }

sub getThumbnail            { $_[0]->{'Thumbnail'                   } }
sub setThumbnail            { $_[0]->{'Thumbnail'                   } = $_[1]; $_[0] }

# ---------------------- applyFuzzy -----------------------

sub applyFuzzyVisibleParts {
   my $Self = shift;

   return unless($Self->getVisiblePartsAreFuzzy());

   my @visibleParts;

   foreach my $part (@{$Self->getParts()}) {
     my $partName = $part->{Name};
     foreach my $vp (@{$Self->getVisibleParts()}) {
       if($partName =~ /$vp/) {
         push @visibleParts, $partName;
         last;
       }
     }
   }

   $Self->setVisibleParts(\@visibleParts);

   return $Self;
}

# ---------------------------- numberOfParts -----------------------------

sub applyVisiblePartsDefaults {
   my $Self = shift;

   my @parts = @{$Self->getVisibleParts()};

   if (scalar @parts == 0) {
      $Self->setVisibleParts([ map { $_->{Name} } @{$Self->getParts()} ]);
   }

   return $Self;
}



# ---------------------------- numberOfParts -----------------------------

sub numberOfVisibleParts {
   my $Self = shift;

   my $Rv = scalar @{$Self->getVisibleParts()};

   return $Rv;
}

# ----------------------------- allPartNames -----------------------------

sub allPartNames {
   my $Self = shift;

   my @Rv = map { $_->{Name} } @{$Self->getParts()};

   return wantarray ? @Rv : \@Rv;
}

# ---------------------------- partIsVisible -----------------------------

sub partIsVisible {
   my $Self = shift;

   my %Rv = map { ( $_ => 0 ) } $Self->allPartNames();

   foreach (@{$Self->getVisibleParts()}) {
      $Rv{$_} = 1;
   }

   return wantarray ? %Rv : \%Rv;
}

# ----------------------------- totalHeight ------------------------------

sub totalHeight {
   my $Self = shift;

   my $Rv = 0;

   my $vis_b = $Self->partIsVisible();

   foreach my $_part (@{$Self->getParts()}) {
      $Rv += $_part->{Size} if $vis_b->{$_part->{Name}};
   }

   return $Rv;
}

# ---------------------------- rScreenVectors ----------------------------

sub rScreenVectors {
   my $Self = shift;

   my @Rv;

   my %isVis_b = $Self->partIsVisible();
   my @_parts  = @{$Self->getParts()};

   my $totalHeight = $Self->totalHeight();

   my $top     = 1.0;
   foreach my $_part (@_parts) {
      next unless $isVis_b{$_part->{Name}};
      my $prop = $_part->{Size} / $totalHeight;
      $top -= $prop;
      push(@Rv,
           sprintf('c(0,1,%f,%f)', $top, $top + $prop)
          );
   }

   return wantarray ? @Rv : join(', ', @Rv);
}

# ========================================================================
# ---------------------------- End of Package ----------------------------
# ========================================================================

1;
