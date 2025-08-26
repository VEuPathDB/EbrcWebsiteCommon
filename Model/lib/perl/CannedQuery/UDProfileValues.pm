package EbrcWebsiteCommon::Model::CannedQuery::UDProfileValues;
@ISA = qw( EbrcWebsiteCommon::Model::CannedQuery );

use strict;

use EbrcWebsiteCommon::Model::CannedQuery;

sub init {
  my $Self = shift;
  my $Args = ref $_[0] ? shift : {@_};

  $Self->SUPER::init($Args);

  $Self->setId($Args->{Id});
  $Self->setProfileSetId($Args->{ProfileSetId});

  $Self->setSql(<<Sql);
select e.value, pan.node_order_num as element_order
from apidbuserdatasets.ud_protocolappnode pan
   , apidbuserdatasets.ud_nafeatureexpression e
   , webready.GeneAttributes ga
where pan.profile_set_id = '<<ProfileSetId>>'
and pan.protocol_app_node_id = e.protocol_app_node_id
and ga.na_feature_id = e.na_feature_id
and ga.source_id = '<<Id>>'
order by pan.node_order_num, pan.protocol_app_node_id
Sql

  return $Self;
}

sub getId                   { $_[0]->{'Id'                } }
sub setId                   { $_[0]->{'Id'                } = $_[1]; $_[0] }

sub getProfileSetId         { $_[0]->{'ProfileSetId'      } }
sub setProfileSetId         { $_[0]->{'ProfileSetId'      } = $_[1]; $_[0] }


sub prepareDictionary {
  my $Self = shift;
  my $Dict = shift || {};

  my $Rv = $Dict;

  $Dict->{Id}         = $Self->getId();
  $Dict->{ProfileSetId} = $Self->getProfileSetId();

  return $Rv;
}

1;






