package EbrcWebsiteCommon::Model::CannedQuery::PathwayGeneraNames;
@ISA = qw( EbrcWebsiteCommon::Model::CannedQuery );

use strict;

use EbrcWebsiteCommon::Model::CannedQuery;

sub init {
  my $Self = shift;
  my $Args = ref $_[0] ? shift : {@_};

  $Self->SUPER::init($Args);

  $Self->setGenera($Args->{Genera});

  return $Self;
}

sub prepareDictionary { }

sub setGenera { $_[0]->{_genera} = $_[1] }
sub getGenera { $_[0]->{_genera} }

sub getValues {
   my $Self = shift;

   my @Rv;
   my $i = 1;
   foreach(@{$Self->getGenera()}) {
     my $row = {ELEMENT_ORDER => $i,
                NAME => $_
     };

     push @Rv, $row;
     $i++;
   }


   return wantarray ? @Rv : \@Rv;
}

# ========================================================================
# ---------------------------- End of Package ----------------------------
# ========================================================================

1;




