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

sub getTest                      { $_[0]->{'_test'             }}
sub setTest                      { $_[0]->{'_test'             } = $_[1]}

sub new {
  my ( $class, $params ) = @_;

  my $self = bless {}, $class;

  unless ($params->{Id}) {
    die "Must provide source_id for participant."
  }

  $self->setId($params->{Id});
 
 #this below to appease cannedquery.pm
  $self->setName($params->{Id});
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

  if (defined $params->{test}) {
    $self->setTest($params->{test});
    unless ($params->{contXAxis}) {
      die "Must provide source_id for x-axis."
    }
    $self->setContXAxis($params->{contXAxis});
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
    require ClinEpiWebsite::Model::CannedQuery::NodeMetadataTest;
    ClinEpiWebsite::Model::CannedQuery::NodeMetadataTest->import();
    1;
  };

  if ($clinepi) {
    my $profile;
    #this means if you try to pass it both the params for nodemetadata and nodemetadataevent
    #at the same time it will just do the first.
    if ($self->getYAxis()) {
      my $contXAxis = $self->getContXAxis();
      my $yAxis = $self->getYAxis();
      $profile = ClinEpiWebsite::Model::CannedQuery::NodeMetadata->new
        ( Id               => $id,
          Name             => "_data_$suffix",
          ContXAxis        => $contXAxis,
          YAxis            => $yAxis,
         );
    } elsif ($self->getEventStart()) {
      my $eventStart = $self->getEventStart();
      my $eventDur = $self->getEventDur();
      $profile = ClinEpiWebsite::Model::CannedQuery::NodeMetadataEventDur->new
        ( Id               => $id,
          Name             => "_data_$suffix",
          EventStart       => $eventStart,
          EventDur         => $eventDur,
         );
    } elsif ($self->getTest()) {
      my $contXAxis = $self->getContXAxis();
      my $test = $self->getTest();
      $profile = ClinEpiWebsite::Model::CannedQuery::NodeMetadataTest->new
        ( Id               => $id,
          Name             => "_data_$suffix",
          ContXAxis        => $contXAxis,
          Test            => $test,
         );
    } else {
      #and if you pass it nothing it will default to age days against weight for height zscore
      $profile = ClinEpiWebsite::Model::CannedQuery::NodeMetadata->new
        ( Id               => $id,
          Name             => "_data_$suffix",
          ContXAxis        => 'EUPATH_0000644',
          YAxis            => 'EUPATH_0000734',
         );
    }
    $self->setNodeMetadataCannedQuery($profile);
  
  return $profile;
  }
}

1;
