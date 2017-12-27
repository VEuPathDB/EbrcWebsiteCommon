package EbrcWebsiteCommon::View::GraphPackage::NodeMetadataSet;

use strict;
use vars qw( @ISA );

@ISA = qw( EbrcWebsiteCommon::View::GraphPackage::ProfileSet );
use EbrcWebsiteCommon::View::GraphPackage::ProfileSet;


use Data::Dumper;

sub getId                        { $_[0]->{'_id'               }}
sub setId                        { $_[0]->{'_id'               } = $_[1]}

sub getEventStart                { $_[0]->{'_event_start'      }}
sub setEventStart                { $_[0]->{'_event_start'      } = $_[1]}

sub getEventDur                  { $_[0]->{'_event_dur'        }}
sub setEventDur                  { $_[0]->{'_event_dur'        } = $_[1]}

sub getStatus                    { $_[0]->{'_status'           }}
sub setStatus                    { $_[0]->{'_status'           } = $_[1]}

sub getOptStatus                 { $_[0]->{'_opt_status'       }}
sub setOptStatus                 { $_[0]->{'_opt_status'       } = $_[1]}

sub getTblPrefix                 { $_[0]->{'_tbl_prefix'       }}
sub setTblPrefix                 { $_[0]->{'_tbl_prefix'       } = $_[1]}

sub new {
  my ( $class, $params ) = @_;

  my $self = bless {}, $class;

  unless ($params->{Id}) {
    die "Must provide source_id for participant."
  }

  $self->setId($params->{Id});
 
 #this below to appease cannedquery.pm
  $self->setName($params->{Id});
 #this so we know which metadata table to query for various ClinEpi datasets
  $self->setTblPrefix($params->{tblPrefix});

  #this later is checked to know which query to run.
  if (defined $params->{yAxis}) {
    $self->setYAxis($params->{yAxis});
    unless ($params->{contXAxis}) {
      die "Must provide source_id for x-axis.";
    }
    $self->setContXAxis($params->{contXAxis});
  }
  #later, if this is defined then a second query will be called
  if (defined $params->{eventStart}) {
    $self->setEventStart($params->{eventStart});
    unless ($params->{eventDur}) {
      die "Must provide source_id for event duration.";
    }
    $self->setEventDur($params->{eventDur});
  }

  if (defined $params->{status}) {
    $self->setStatus($params->{status});
    unless ($params->{contXAxis}) {
      die "Must provide source_id for x-axis."
    }
    $self->setContXAxis($params->{contXAxis});
    if (defined $params->{optStatus}) {
      $self->setOptStatus($params->{optStatus});
    }
  }  
  $self->{_errors} = [];
  
  return $self;
}

sub writeFiles {

  my ($self, $id, $qh, $suffix) = @_;

  $id = $self->getAlternateSourceId() ? $self->getAlternateSourceId() : $id;

  $self->writeNodeMetadata($id, $qh, $suffix);

}

sub writeNodeMetadata{
  my ($self, $id, $qh, $suffix) = @_;

  my $_dict = {};

  my $profile = $self->getNodeMetadataCannedQuery($suffix, $id);

  $profile->prepareDictionary($_dict);

  my $profile_fn = eval { $profile->makeTabFile($qh, $_dict) }; $@ && $self->logError($@);

  $self->setProfileFile($profile_fn);

}

sub setNodeMetadataCannedQuery {
  my ($self, $cannedQuery) = @_;
  $self->{_node_metadata_canned_query} = $cannedQuery;
}

sub getNodeMetadataCannedQuery {
  my ($self, $suffix, $id) = @_;
  return $self->{_node_metadata_canned_query} if($self->{_node_metadata_canned_query});
  return $self->makeNodeMetadataCannedQuery($id, $suffix);
}

sub makeNodeMetadataCannedQuery {
  my ($self, $id, $suffix) = @_;

  my $clinepi = eval
  {
    require ClinEpiWebsite::Model::CannedQuery::NodeMetadata;
    ClinEpiWebsite::Model::CannedQuery::NodeMetadata->import();
    require ClinEpiWebsite::Model::CannedQuery::NodeMetadataEventDur;
    ClinEpiWebsite::Model::CannedQuery::NodeMetadataEventDur->import();
    require ClinEpiWebsite::Model::CannedQuery::NodeMetadataStatus;
    ClinEpiWebsite::Model::CannedQuery::NodeMetadataStatus->import();
    1;
  };

  if ($clinepi) {
    my $profile;
    #this means if you try to pass it both the params for nodemetadata and nodemetadataevent
    #at the same time it will just do the first.
    my $tblPrefix = $self->getTblPrefix();
    if ($self->getYAxis()) {
      my $contXAxis = $self->getContXAxis();
      my $yAxis = $self->getYAxis();
      $profile = ClinEpiWebsite::Model::CannedQuery::NodeMetadata->new
        ( Id               => $id,
          Name             => "_data_$suffix",
          ContXAxis        => $contXAxis,
          YAxis            => $yAxis,
          TblPrefix        => $tblPrefix,
         );
    } elsif ($self->getEventStart()) {
      my $eventStart = $self->getEventStart();
      my $eventDur = $self->getEventDur();
      $profile = ClinEpiWebsite::Model::CannedQuery::NodeMetadataEventDur->new
        ( Id               => $id,
          Name             => "_data_$suffix",
          EventStart       => $eventStart,
          EventDur         => $eventDur,
          TblPrefix        => $tblPrefix,
         );
    } elsif ($self->getStatus()) {
      my $contXAxis = $self->getContXAxis();
      my $status = $self->getStatus();
      if ($self->getOptStatus()) {
        my $optStatus = $self->getOptStatus();
        $profile = ClinEpiWebsite::Model::CannedQuery::NodeMetadataStatus->new
          ( Id               => $id,
            Name             => "_data_$suffix",
            ContXAxis        => $contXAxis,
            Status           => $status,
            OptStatus        => $optStatus,
            TblPrefix        => $tblPrefix,
           );

      } else {
        $profile = ClinEpiWebsite::Model::CannedQuery::NodeMetadataStatus->new
          ( Id               => $id,
            Name             => "_data_$suffix",
            ContXAxis        => $contXAxis,
            Status           => $status,
            TblPrefix        => $tblPrefix,
           );
      }
    } 
    $self->setNodeMetadataCannedQuery($profile);
  
  return $profile;
  }
}

1;
