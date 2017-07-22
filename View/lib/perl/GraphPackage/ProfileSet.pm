package EbrcWebsiteCommon::View::GraphPackage::ProfileSet;

use strict;

use Data::Dumper;

use ApiCommonWebsite::Model::CannedQuery::ElementNamesWithMetaData;

use ApiCommonWebsite::Model::CannedQuery::Profile;
use ApiCommonWebsite::Model::CannedQuery::ProfileByEC;


# Main Profile Set Name
sub getName                      { $_[0]->{'_name'             }}
sub setName                      { $_[0]->{'_name'             } = $_[1]}

sub getSubId                     { $_[0]->{'_sub_id'           }}
sub setSubId                     { $_[0]->{'_sub_id'           } = $_[1]} 

sub getType                      { $_[0]->{'_type'             }}
sub setType                      { $_[0]->{'_type'             } = $_[1]}

sub getElementNames              { $_[0]->{'_element_names'                  }}
sub setElementNames              { $_[0]->{'_element_names'                  } = $_[1]}

sub getRelatedProfileSet         { $_[0]->{'_related_profile_set'             }}
sub setRelatedProfileSet         { $_[0]->{'_related_profile_set'             } = $_[1]}

sub getDisplayName    {
  my ($self) = @_;
  if ($self->{'_display_name'}) {
    return $self->{'_display_name'};
  }
  return $self->getName();
}
sub setDisplayName    { $_[0]->{'_display_name'         } = $_[1]}

sub getProfileFile              { $_[0]->{'_profile_file'               }}
sub setProfileFile              { $_[0]->{'_profile_file'               } = $_[1]}

sub getElementNamesFile         { $_[0]->{'_element_names_file'           }}
sub setElementNamesFile         { $_[0]->{'_element_names_file'           } = $_[1]}

sub getAlternateSourceId              { $_[0]->{'_alternate_source_id'               }}
sub setAlternateSourceId              { $_[0]->{'_alternate_source_id'               } = $_[1]}

sub getScale              { $_[0]->{'_scale'               }}
sub setScale              { $_[0]->{'_scale'               } = $_[1]}

sub getFacet         { $_[0]->{'_facet'               }}
sub setFacet         { $_[0]->{'_facet'               }  = $_[1]}

sub getContXAxis         { $_[0]->{'_cont_x_axis'               }}
sub setContXAxis         { $_[0]->{'_cont_x_axis'               }  = $_[1]}


sub logError              { push @{$_[0]->{'_errors'}}, $_[1] }
sub errors                { $_[0]->{'_errors'               }}

sub new {
  my ($class, $name, $type, $elementNames, $alternateSourceId, $scale, $facet, $displayName, $subId, $contXAxis) = @_;

  unless($name) {
    die "ProfileSet Name missing: $!";
  }

  my $self = bless {}, $class;

  $self->setName($name);
  $self->setType($type);
  $self->setDisplayName($displayName);
  $self->setSubId($subId);

  unless(ref($elementNames) eq 'ARRAY') {
    $elementNames = [];
  }
  $self->setElementNames($elementNames);
  $self->setAlternateSourceId($alternateSourceId);
  $self->setScale($scale);
  if (defined $facet) {
    $self->setFacet($facet);
  }

  if (defined $contXAxis) {
    $self->setContXAxis($contXAxis);
  }


  # initialize errors array;
  $self->{_errors} = [];

  return $self;
}

sub writeFiles {
  my ($self, $id, $qh, $suffix, $idType) = @_;

  $id = $self->getAlternateSourceId() ? $self->getAlternateSourceId() : $id;

  $self->writeProfileFile($id, $qh, $suffix, $idType);
  $self->writeElementNamesFile($id, $qh, $suffix);

  # don't need to write the element names file for the related set
  if(my $relatedProfileSet = $self->getRelatedProfileSet()) {
    $suffix = "related" . $suffix;
    $relatedProfileSet->writeProfileFile($id, $qh, $suffix, $idType);

    # track the error for a related profile set (can assume only 1)
    if(my $relatedError = $relatedProfileSet->errors()->[0]) {
      $self->logError($relatedError);
    }

  }
}

sub writeProfileFile{
  my ($self, $id, $qh, $suffix, $idType) = @_;

  my $_dict = {};

  my $elementNames = $self->getElementNames();

  my $profile = $self->getProfileCannedQuery($suffix, $idType, $id);

  $profile->prepareDictionary($_dict);

  my @elementOrder;
  if(scalar @$elementNames > 0) {
    for my $i (1..scalar @$elementNames) {
      if($elementNames->[$i - 1]) {
        push @elementOrder, $i;
      }
    }
  }

  $profile->setElementOrder(\@elementOrder) if(scalar @$elementNames > 0);

  my $profile_fn = eval { $profile->makeTabFile($qh, $_dict) }; $@ && $self->logError($@);


#  print STDERR "PROFILEFILE=$profile_fn\n";

  $self->setProfileFile($profile_fn);

}

sub writeElementNamesFile {
  my ($self, $id, $qh, $suffix) = @_;

  my $_dict = {};
 
  my $elementNames = $self->getElementNames();

  my $elementNamesProfile = $self->getProfileNamesCannedQuery($suffix, $id);

  $elementNamesProfile->setElementOrder($elementNames) if(scalar @$elementNames > 0);
  my $elementNames_fn = eval { $elementNamesProfile->makeTabFile($qh, $_dict)  }; $@ && $self->logError($@);


#  print STDERR "ELEMNTNAMES=$elementNames_fn\n";
  $self->setElementNamesFile($elementNames_fn);

}



sub setProfileCannedQuery {
  my ($self, $cannedQuery) = @_;
  $self->{_profile_canned_query} = $cannedQuery;
}

sub getProfileCannedQuery {
  my ($self, $suffix, $idType, $id) = @_;
  return $self->{_profile_canned_query} if($self->{_profile_canned_query});

  return $self->makeProfileCannedQuery($suffix, $idType, $id);
}


sub makeProfileCannedQuery {
  my ($self, $suffix, $idType, $id) = @_;

  my $profileSetName = $self->getName();
  my $profileSetType = $self->getType();
  my $scale = $self->getScale();
  my $subId = $self->getSubId();

  my $profile;
  if(($idType) && lc($idType) eq 'ec') {
    $profile = ApiCommonWebsite::Model::CannedQuery::ProfileByEC->new
        ( Name         => "_data_$suffix",
          Id           => $id,
          ProfileSet   => $profileSetName,
	  ProfileType => $profileSetType,
          Scale        => $scale,
        );
  }

  else {
    if ($subId) {
        $id = "$id|$subId";
    }
    $profile = ApiCommonWebsite::Model::CannedQuery::Profile->new
        ( Name         => "_data_$suffix",
        #if there is a suffix, append suffix to id
          Id           => $id,
          ProfileSet   => $profileSetName,
	  ProfileType => $profileSetType,
          Scale        => $scale,
        );
  }

  $self->setProfileCannedQuery($profile);

  return $profile;
}


sub setProfileNamesCannedQuery {
  my ($self, $cannedQuery) = @_;
  $self->{_profile_names_canned_query} = $cannedQuery;
}

sub getProfileNamesCannedQuery {
  my ($self, $suffix, $id) = @_;
  return $self->{_profile_names_canned_query} if($self->{_profile_names_canned_query});

  return $self->makeProfileNamesCannedQuery($suffix, $id);
}


sub makeProfileNamesCannedQuery {
  my ($self, $suffix, $id) = @_;

  my $profileSetName = $self->getName();
  my $profileSetType = $self->getType();
  my $facet = $self->getFacet();
  my $contXAxis = $self->getContXAxis();

  my $elementNamesProfile;
   if($facet || $contXAxis) {
     $elementNamesProfile = ApiCommonWebsite::Model::CannedQuery::ElementNamesWithMetaData->new
       ( Name         => "_names_$suffix",
         Id           => $id,
         ProfileSet   => $profileSetName,
	 ProfileType => $profileSetType,
         Facet => $facet,
         ContXAxis => $contXAxis,
       );
   }
   else {
     $elementNamesProfile = ApiCommonWebsite::Model::CannedQuery::ElementNames->new
      ( Name         => "_names_$suffix",
        Id           => $id,
        ProfileSet   => $profileSetName,
	 ProfileType => $profileSetType,
      );
   }

}
1;
