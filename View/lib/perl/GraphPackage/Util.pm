package EbrcWebsiteCommon::View::GraphPackage::Util;

use strict;

use Math::Round;

use EbrcWebsiteCommon::View::GraphPackage::ProfileSet;
use EbrcWebsiteCommon::View::GraphPackage::NodeMetadataSet;

use Data::Dumper;

sub makeNodeMetadataSet {
  my (@arr) = @_;
  my @rv;

  foreach my $row (@arr) {
    if (ref($row) eq 'ARRAY') {
      foreach my $nextProfile (@{$row}) {
        print STDERR Dumper($nextProfile);
        if (!defined $nextProfile->{yAxis} && !defined $nextProfile->{eventStart} && !defined $nextProfile->{status} && !defined $nextProfile->{sampleInfo}) {
        warn "An empty profile was passed to Util.pm... Was this intentional?";
      } else {
        my $profile = EbrcWebsiteCommon::View::GraphPackage::NodeMetadataSet->new($nextProfile);

        push @rv, $profile;
      } 
      }
    } else {
      #check if anything was passed.
      print STDERR Dumper($row);
      if (!defined $row->{yAxis} && !defined $row->{eventStart} && !defined $row->{status} && !defined $row->{sampleInfo}) {
        warn "An empty profile was passed to Util.pm... Was this intentional?";
      } else {
        my $profile = EbrcWebsiteCommon::View::GraphPackage::NodeMetadataSet->new($row);

        push @rv, $profile;
      }
    }
  }
  return \@rv;
}

sub makeProfileSets {
  my ($arr) = @_;

  my @rv;

  foreach my $row (@$arr) {
    my $mainProfileSet = $row->[0];
    my $mainProfileType = $row->[1];
    my $relatedProfileSet = $row->[2];
    my $relatedProfileType = $row->[3];
    my $elementNames = $row->[4];
    my $alternateSourceId = $row->[5];
    my $scale = $row->[6];
    my $facet = $row->[7];
    my $mainProfileSetDisplayName = $row->[8];
    my $subId = $row->[9];
    my $contXAxis = $row->[10];

    my $profileSet = EbrcWebsiteCommon::View::GraphPackage::ProfileSet->new($mainProfileSet, $mainProfileType, $elementNames, $alternateSourceId, $scale, $facet, $mainProfileSetDisplayName, $subId, $contXAxis);

    if($relatedProfileSet) {
      my $relatedSet = EbrcWebsiteCommon::View::GraphPackage::ProfileSet->new($relatedProfileSet, $relatedProfileType, $elementNames, $alternateSourceId, $scale, $facet, '', $subId, $contXAxis);
      $profileSet->setRelatedProfileSet($relatedSet);
    }
    push @rv, $profileSet;
  }
  return \@rv;
}



sub getProfileSetsSql {
  my ($restrictBySourceId, $sourceId) = @_;

  if($restrictBySourceId) {
    return "
select DISTINCT pt.profile_set_name, pt.profile_type
from apidbtuning.profiletype pt, apidbtuning.profile p
  ,  (select distinct sl.study_id
      from study.studylink sl, apidbtuning.PanResults panr
      where sl.protocol_app_node_id = panr.pan_id
      and panr.result_table = 'Results::NAFeatureDiffResult') dr
 , apidbtuning.DatasetNameTaxon dnt
where dnt.dataset_presenter_id = ?
and pt.dataset_name = dnt.name
and pt.profile_study_id = dr.study_id (+)
and dr.study_id is null
and p.profile_study_id = pt.profile_study_id
and p.profile_type = pt.profile_type
and p.source_id = '$sourceId'
";
  }


  return "
select DISTINCT pt.profile_set_name, pt.profile_type
from apidbtuning.profiletype pt
  ,  (select distinct sl.study_id
      from study.studylink sl, apidbtuning.PanResults panr
      where sl.protocol_app_node_id = panr.pan_id
      and panr.result_table = 'Results::NAFeatureDiffResult') dr
 , apidbtuning.DatasetNameTaxon dnt
where dnt.dataset_presenter_id = ?
and pt.dataset_name = dnt.name
and pt.profile_study_id = dr.study_id (+)
and dr.study_id is null
";


}


sub rStringVectorFromArrayNotNamed {
  my ($stringArray) = @_;

  return "c(" . join(',', map { defined $_ ? "\"$_\"" : "\"\""} @$stringArray) . ")";
}

sub rStringVectorFromArray {
  my ($stringArray, $name) = @_;

  return "$name = c(" . join(',', map { defined $_ ? "\"$_\"" : "\"\""} @$stringArray) . ");";
}

sub rNumericVectorFromArray {
  my ($array, $name) = @_;

  return "$name = c(" . join(',', map {"$_"} @$array) . ");";
}

sub rBooleanVectorFromArray {
  &rNumericVectorFromArray(@_);
}

sub isSeen {
  my ($x, $ar) = @_;

  foreach(@$ar) {
    return 1 if($_->{name} eq $x);
  }
  return 0;
}

sub getLighterColorFromHex {
  my ($color) = @_;

  unless($color =~ /^\#\w\w\w\w\w\w$/) {
    print STDERR "Must use hex values for input color\n";
    return $color
  }

  my @col = (hex(substr($color, 1, 2)),
             hex(substr($color, 3, 2)),
             hex(substr($color,5, 2))
             );

  my @lighter = (255 - (255 - $col[0]) / 4,
                 255 - (255 - $col[1]) / 4,
                 255 - (255 - $col[2]) / 4
                 );

  return "#" . sprintf("%02X%02X%02X", $lighter[0], $lighter[1], $lighter[2]);
}

1;
