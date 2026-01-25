package EbrcWebsiteCommon::Model::CannedQuery::PathwayGeneraData;
@ISA = qw( EbrcWebsiteCommon::Model::CannedQuery );

use strict;

use Data::Dumper;

use EbrcWebsiteCommon::Model::CannedQuery;

sub init {
  my $Self = shift;
  my $Args = ref $_[0] ? shift : {@_};

  $Self->SUPER::init($Args);

  $Self->setId                   ( $Args->{Id                  } );
  $Self->setGenera($Args->{Genera});



  

  $Self->setSql(<<Sql);
select case when ec.genus is null then 0 else 1 end as value
, orgs.o as element_order
from (select distinct genus
      from apidb.ecnumbergenus
      where ec_number LIKE REPLACE(REPLACE(REPLACE(REPLACE(lower('<<Id>>'),' ',''),'-', '%'),'*','%'),'any','%')
 UNION
 select distinct 'Plasmodium' as genus
 from dots.AaSequenceEnzymeClass asec, sres.EnzymeClass ec
 where ec.enzyme_class_id = asec.enzyme_class_id
 and ec.ec_number LIKE REPLACE(REPLACE(REPLACE(REPLACE(lower('<<Id>>'),' ',''),'-', '%'),'*','%'),'any','%')
        ) ec
 RIGHT JOIN (
   <<Genera>>
   ) orgs ON orgs.genus = ec.genus
order by orgs.o asc
Sql

  return $Self;
}


sub getId                   { $_[0]->{'Id'                } }
sub setId                   { $_[0]->{'Id'                } = $_[1]; $_[0] }

sub setGenera { $_[0]->{_genera} = $_[1] }
sub getGenera { $_[0]->{_genera} }


sub prepareDictionary {
	 my $Self = shift;
	 my $Dict = shift || {};

	 my $Rv = $Dict;

	 $Dict->{Id}         =  $Self->getId();

         my $i = 1;

         $Dict->{Genera} = join ("\nunion\n", map { "select '$_' as genus, " . $i++ . " as o from dual"  } @{$Self->getGenera()});
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

       $countNonZero++ if($_row->{VALUE});
     }
   $_sh->finish();

   unless($countNonZero) {
     die "No genera w/ matching EC";
   }

   return wantarray ? @Rv : \@Rv;
}


1;
