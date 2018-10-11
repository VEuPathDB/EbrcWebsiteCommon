package EbrcWebsiteCommon::Model::CannedQuery::UDProfileNames;
@ISA = qw( EbrcWebsiteCommon::Model::CannedQuery );

use strict;

use EbrcWebsiteCommon::Model::CannedQuery;

sub init {
  my $Self = shift;
  my $Args = ref $_[0] ? shift : {@_};

  $Self->SUPER::init($Args);

  $Self->setProfileSetId($Args->{ProfileSetId});

  $Self->setSql(<<Sql);
select name, node_order_num as element_order 
from apidbuserdatasets.ud_protocolappnode 
where profile_set_id = '<<ProfileSetId>>'
order by node_order_num, protocol_app_node_id
Sql

  return $Self;
}

sub getProfileSetId         { $_[0]->{'ProfileSetId'      } }
sub setProfileSetId         { $_[0]->{'ProfileSetId'      } = $_[1]; $_[0] }


sub prepareDictionary {
  my $Self = shift;
  my $Dict = shift || {};

  my $Rv = $Dict;

  $Dict->{ProfileSetId} = $Self->getProfileSetId();

  return $Rv;
}

1;


