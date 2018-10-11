package EbrcWebsiteCommon::Model::CannedQuery::ProfileFixedValue;
@ISA = qw( EbrcWebsiteCommon::Model::CannedQuery::Profile );

use strict;

use EbrcWebsiteCommon::Model::CannedQuery::Profile;

sub init {
  my $Self = shift;
  my $Args = ref $_[0] ? shift : {@_};

  $Self->SUPER::init($Args);

  my $defaultValue = $Args->{DefaultValue} || 0;

  $Self->setSql(<<Sql);
select replace(apidb.tab_to_string(set(CAST(COLLECT(ps.name) AS apidb.varchartab)), chr(9)), ps.name, '$defaultValue') as profile_as_string
from apidb.profileelementname pen, apidb.profileset ps
where pen.profile_set_id = ps.profile_set_id
and ps.name = '<<ProfileSet>>'
and '<<Id>>' is not null
group by ps.name

Sql

  return $Self;
}

1;










