
package EbrcWebsiteCommon::Model::CannedQuery::ProfileSet;

=pod

=head1 Purpose

This canned query selects all profiles in a ProfileSet.

=head1 Macros

The following macros must be available to execute this query.

=over

=item Profile - source id of the profile set.

=back

=cut

# ========================================================================
# ----------------------------- Declarations -----------------------------
# ========================================================================

use strict;
use vars qw( @ISA );

@ISA = qw( EbrcWebsiteCommon::Model::CannedQuery );
use EbrcWebsiteCommon::Model::CannedQuery;

# ========================================================================
# ----------------------- Create, Init, and Access -----------------------
# ========================================================================

# --------------------------------- init ---------------------------------

sub init {
  my $Self = shift;
  my $Args = ref $_[0] ? shift : {@_};

  $Self->SUPER::init($Args);

  $Self->setCollated(1);

	$Self->setProfileSet           ( $Args->{ProfileSet          } );

  $Self->setSql(<<Sql);
SELECT source_id          as column_name
,      profile_AS_STRING
FROM   apidb.Profile    p
,      apidb.ProfileSet ps
WHERE  p.profile_set_id = ps.profile_set_id
AND    ps.name          = '<<ProfileSet>>'
Sql

  return $Self;
}

# -------------------------------- access --------------------------------

sub getId                   { $_[0]->{'Id'                } }
sub setId                   { $_[0]->{'Id'                } = $_[1]; $_[0] }

sub getProfileSet           { $_[0]->{'ProfileSet'        } }
sub setProfileSet           { $_[0]->{'ProfileSet'        } = $_[1]; $_[0] }

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




