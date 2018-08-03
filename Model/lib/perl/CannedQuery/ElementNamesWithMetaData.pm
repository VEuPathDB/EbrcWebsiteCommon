
package EbrcWebsiteCommon::Model::CannedQuery::ElementNamesWithMetaData;
@ISA = qw( EbrcWebsiteCommon::Model::CannedQuery::ElementNames);

=pod

=head1 Purpose

This canned query selects the element names and associated metadata for a profileSet with a
given name and a given meta data category.

=head1 Macros

The following macros must be available to execute this query.

=over

=item ProfileSet - source id of the profile set. Category - Ontology entry value (metadata parent term).

=back

=cut

# ========================================================================
# ----------------------------- Declarations -----------------------------
# ========================================================================

use strict;

use FileHandle;

use EbrcWebsiteCommon::Model::CannedQuery;

use EbrcWebsiteCommon::Model::CannedQuery::ElementNames;

use Data::Dumper;
# ========================================================================
# ----------------------- Create, Init, and Access -----------------------
# ========================================================================

# --------------------------------- init ---------------------------------

sub init {
  my $Self = shift;
  my $Args = ref $_[0] ? shift : {@_};

  $Self->SUPER::init($Args);

  $Self->setFacet           ( $Args->{Facet          } );
  $Self->setContXAxis           ( $Args->{ContXAxis          } );

  my $facets = $Self->getFacet();
  my $facet1 = $facets->[0];
  my $facet2 = $facets->[1];

  $Self->setSql(<<Sql);

select  rownum as element_order, ps.NAME, ps.FACET, ps.CONTXAXIS FROM ( 
 SELECT distinct s.protocol_app_node_name AS name, s.NODE_ORDER_NUM, m1.string_value as facet, m2.string_value as contXAxis 
 FROM  apidbtuning.ProfileSamples s
     , apidbtuning.metadata m1
     , apidbtuning.metadata m2
  WHERE  s.study_name = \'<<ProfileSet>>\'
 AND s.profile_type = \'<<ProfileType>>\'
 --AND m1.study_name(+) = s.study_name
 and m1.PAN_ID(+) = s.PROTOCOL_APP_NODE_ID 
 and m1.property_source_id(+) = \'$facet1\' 
 --AND m2.study_name(+) = s.study_name 
 and m2.PAN_ID(+) = s.PROTOCOL_APP_NODE_ID 
 and m2.property_source_id(+) = \'<<ContXAxis>>\'
 ORDER  BY s.node_order_num
) ps

Sql

  return $Self;
}

# -------------------------------- access --------------------------------

sub getFacet           { $_[0]->{'Facet'        } }
sub setFacet           { $_[0]->{'Facet'        } = $_[1]; $_[0] }

sub getContXAxis           { $_[0]->{'ContXAxis'        } }
sub setContXAxis           { $_[0]->{'ContXAxis'        } = $_[1]; $_[0] }


# ========================================================================
# --------------------------- Support Methods ----------------------------
# ========================================================================

sub prepareDictionary {
	 my $Self = shift;
	 my $Dict = shift || {};

         $Dict->{ProfileSet} = $Self->getProfileSet();
	 $Dict->{ProfileType} = $Self->getProfileType();
	 $Dict->{Facet} = $Self->getFacet();
	 $Dict->{ContXAxis} = $Self->getContXAxis();

         my $Rv = $Dict;

	 return $Rv;
}



# ========================================================================
# ---------------------------- End of Package ----------------------------
# ========================================================================

1;




