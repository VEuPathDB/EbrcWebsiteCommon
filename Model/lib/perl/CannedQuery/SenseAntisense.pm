package EbrcWebsiteCommon::Model::CannedQuery::SenseAntisense;
@ISA = qw( EbrcWebsiteCommon::Model::CannedQuery );

use strict;

use EbrcWebsiteCommon::Model::CannedQuery;

sub init {
  my $Self = shift;
  my $Args = ref $_[0] ? shift : {@_};

  $Self->SUPER::init($Args);

  $Self->setProfileSetId($Args->{ProfileSetId});
  $Self->setId($Args->{Id});
  $Self->setAntisenseFloor($Args->{AntisenseFloor});

  return $Self;
}

sub getProfileSetId         { $_[0]->{'ProfileSetId'      } }
sub setProfileSetId         { $_[0]->{'ProfileSetId'      } = $_[1]; $_[0] }
sub getId         { $_[0]->{'Id'      } }
sub setId         { $_[0]->{'Id'      } = $_[1]; $_[0] }
sub getAntisenseFloor         { $_[0]->{'AntisenseFloor'      } }
sub setAntisenseFloor         { $_[0]->{'AntisenseFloor'      } = $_[1]; $_[0] }


sub prepareDictionary {
  my $Self = shift;
  my $Dict = shift || {};

  my $Rv = $Dict;

  $Dict->{ProfileSetId} = $Self->getProfileSetId();
  $Dict->{Id} = $Self->getId();
  $Dict->{AntisenseFloor} = $Self->getAntisenseFloor();

  return $Rv;
}

1;


