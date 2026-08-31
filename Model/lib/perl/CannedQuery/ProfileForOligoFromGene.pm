
package EbrcWebsiteCommon::Model::CannedQuery::ProfileForOligoFromGene;
@ISA = qw( EbrcWebsiteCommon::Model::CannedQuery );

=pod

=head1 Purpose

This canned query selects a profile with a given ID from a profile of
interest.

It assumes that the values of the profile are in a tab-delimited
string.

=head1 Macros

The following macros must be available to execute this query.

=over

=item ID - oligo or gene id.

=item Profile - source id of the profile set.

=back

=cut

# ========================================================================
# ----------------------------- Declarations -----------------------------
# ========================================================================

use strict;

use EbrcWebsiteCommon::Model::CannedQuery;

# ========================================================================
# ----------------------- Create, Init, and Access -----------------------
# ========================================================================

# --------------------------------- init ---------------------------------

sub init {
  my $Self = shift;
  my $Args = ref $_[0] ? shift : {@_};

  $Self->SUPER::init($Args);

  $Self->setId                   ( $Args->{Id                  } );
  $Self->setProfileSet           ( $Args->{ProfileSet          } );
  $Self->setOrgAbbrev($Args->{OrgAbbrev});

  $Self->setSql(<<Sql);
SELECT profile_AS_STRING
FROM   apidb.Profile_p    p
,      apidb.ProfileSet ps
WHERE  p.source_id      = '<<Id>>'
AND    p.profile_set_id = ps.profile_set_id
AND    ps.name          = '<<ProfileSet>>'
AND   p.org_abbrev           = '<<OrgAbbrev>>'
Sql

  return $Self;
}

# -------------------------------- access --------------------------------

sub getId                   { $_[0]->{'Id'                } }
sub setId                   { $_[0]->{'Id'                } = $_[1]; $_[0] }

sub getProfileSet           { $_[0]->{'ProfileSet'        } }
sub setProfileSet           { $_[0]->{'ProfileSet'        } = $_[1]; $_[0] }

sub getOrgAbbrev              { $_[0]->{'OrgAbbrev'           } }
sub setOrgAbbrev              { $_[0]->{'OrgAbbrev'           } = $_[1]; $_[0] }
# ========================================================================
# --------------------------- Support Methods ----------------------------
# ========================================================================

sub prepareDictionary {
	 my $Self = shift;
	 my $Dict = shift || {};

	 my $Rv = $Dict;

	 $Dict->{Id}         = $Self->getId();
	 $Dict->{ProfileSet} = $Self->getProfileSet();

	 return $Rv;
}

# ========================================================================
# ---------------------------- End of Package ----------------------------
# ========================================================================

1;




