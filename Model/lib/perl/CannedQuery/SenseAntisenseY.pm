package EbrcWebsiteCommon::Model::CannedQuery::SenseAntisenseY;
@ISA = qw( EbrcWebsiteCommon::Model::CannedQuery::SenseAntisense );

use strict;

use EbrcWebsiteCommon::Model::CannedQuery::SenseAntisense;

sub init {
  my $Self = shift;
  my $Args = ref $_[0] ? shift : {@_};

  $Self->SUPER::init($Args);

  $Self->setSql(<<Sql);

with comp as (select ps.node_order_num,ps.protocol_app_node_name,na.value
                from apidbtuning.ProfileSamples ps
                    , results.nafeatureexpression na
                    , webready.GeneAttributes_p ga
            where ps.study_name = '<<ProfileSetId>>'
                and ps.profile_type = 'values'
                and ps.protocol_app_node_id =  na.protocol_app_node_id
                and na.na_feature_id = ga.na_feature_id
                and ga.org_abbrev ='<<OrgAbbrev>>'
                and ga.source_id='<<Id>>')
    , ref as (select ps.node_order_num,ps.protocol_app_node_name,na.value
                from apidbtuning.ProfileSamples ps
                   , results.nafeatureexpression na
                   , webready.GeneAttributes_p ga
                where ps.study_name = '<<ProfileSetId>>'
                    and ps.profile_type = 'values'
                    and ps.protocol_app_node_id =  na.protocol_app_node_id
                    and na.na_feature_id = ga.na_feature_id
                    and ga.org_abbrev ='<<OrgAbbrev>>'
                    and ga.source_id='<<Id>>')
select value, ROW_NUMBER() OVER (order by name) as element_order
from ( select 
        ref.protocol_app_node_name || '->' || comp.protocol_app_node_name as name
        , round(log(2,greatest(comp.value,<<AntisenseFloor>>) / greatest(ref.value,<<AntisenseFloor>>)),1) as value
        from comp, ref
        where comp.protocol_app_node_name != ref.protocol_app_node_name)
Sql

  return $Self;
}

1;






