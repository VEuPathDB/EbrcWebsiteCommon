package EbrcWebsiteCommon::Model::CannedQuery::PhenotypeRankedNthSourceIdNames;
@ISA = qw( EbrcWebsiteCommon::Model::CannedQuery );

use strict;

use Data::Dumper;

use EbrcWebsiteCommon::Model::CannedQuery;

sub init {
  my $Self = shift;
  my $Args = ref $_[0] ? shift : {@_};

  $Self->SUPER::init($Args);

  $Self->setId($Args->{Id});
  $Self->setOrgAbbrev($Args->{OrgAbbrev});
  $Self->setSourceIdValueQuery($Args->{SourceIdValueQuery});
  $Self->setN($Args->{N});

  

  $Self->setSql(<<Sql);
with dat as
(
<<SourceIdValueQuery>>
),
ct as                                                                                                                                                                                                   
(select max(rownum) as m from dat)
select source_id as name, rn as element_order from (
select t.value, rownum rn, source_id
from (select source_id, value from dat order by value) t
)
where ('<<Id>>' = 'ALL' AND (rn = 1 or rn = (select ct.m from ct) or mod(rn, round((select ct.m from ct)/<<N>>,0)) = 0))
 OR ('<<Id>>' = source_id and '<<OrgAbbrev>>' = org_abbrev)
Sql

  return $Self;
}


sub getId                   { $_[0]->{'Id'                } }
sub setId                   { $_[0]->{'Id'                } = $_[1]; $_[0] }

sub setSourceIdValueQuery { $_[0]->{_SourceIdValueQuery} = $_[1] }
sub getSourceIdValueQuery{ $_[0]->{_SourceIdValueQuery} }

sub setN { $_[0]->{_n} = $_[1] }
sub getN { $_[0]->{_n} }

sub getOrgAbbrev              { $_[0]->{'OrgAbbrev'           } }
sub setOrgAbbrev              { $_[0]->{'OrgAbbrev'           } = $_[1]; $_[0] }

sub prepareDictionary {
  my $Self = shift;
  my $Dict = shift || {};

  my $Rv = $Dict;

  $Dict->{Id}         =  $Self->getId();
  $Dict->{N}         =  $Self->getN();
  $Dict->{SourceIdValueQuery}         =  $Self->getSourceIdValueQuery();
  return $Rv;
}


sub getValues {
   my $Self = shift;
   my $Qh   = shift;
   my $Dict = shift;

   my @Rv;

   # prepare dictionary
   $Dict = $Self->prepareDictionary($Dict);

   # execute SQL and get result
   my $_sql = $Self->getExpandedSql($Dict);

   my $_sh  = $Qh->prepare($_sql);
   $_sh->execute();

   my $countNonZero;
     while (my $_row = $_sh->fetchrow_hashref()) {
       push(@Rv, $_row);

       $countNonZero++ if($_row->{ELEMENT_ORDER});
     }
   $_sh->finish();

   unless($countNonZero) {
     die "NO value found";
   }

   return wantarray ? @Rv : \@Rv;
}


1;
