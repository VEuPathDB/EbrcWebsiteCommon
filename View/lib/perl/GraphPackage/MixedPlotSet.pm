package EbrcWebsiteCommon::View::GraphPackage::MixedPlotSet;

use strict;
use vars qw( @ISA );

@ISA = qw( EbrcWebsiteCommon::View::GraphPackage::AbstractPlotSet );
use EbrcWebsiteCommon::View::GraphPackage::AbstractPlotSet;

use Tie::IxHash;

sub setMainLegend {
  my ($self, $hash) = @_;

  $hash->{fill} = 1 unless(defined $hash->{fill});
  $hash->{points_pch} = [] unless(defined $hash->{points_pch});
  $self->SUPER::setMainLegend($hash);
}


sub declareParts {
  my ($self) = @_;

  my $graphObjects = $self->getGraphObjects();
  my @parts = map {$_->getPartName()} @$graphObjects;

  return join(",", @parts);
}

#--------------------------------------------------------------------------------

sub getGraphObjects { $_[0]->{_graph_objects} }

sub addGraphObject { push @{$_[0]->{_graph_objects}}, $_[1] }

sub setGraphObjects { 
  my $self = shift;

  unless(scalar @_ >= 1) {
    die "Graph Ojbects Array Not Defined Correctly" ;
  }

  my %profileSetsHash;
  tie %profileSetsHash, 'Tie::IxHash';

  my $graphs = [];

  
  foreach my $plotPart (@_) {
    my $name = $plotPart->getPartName();
    my $size = $plotPart->getScreenSize();
    unless ($name) {  
      die "Part name must be defined"; 
    }
#print STDERR "GOT NAME = $name\n";
    $profileSetsHash{$name}->{size}  = $size;
    $profileSetsHash{$name}->{count}++ ;

    push @{$graphs}, $plotPart;
  }

  #for the mixedPlot, this hash only contains the size and name, this is a workaround for backward compatibility
  $self->setProfileSetsHash(\%profileSetsHash);
  foreach my $name (keys %profileSetsHash) {
    unless ($profileSetsHash{$name}->{count} == 1) {
      die "Non-unique part name $name is defined for mixed plot";
    }
  }

  $self->{_graph_objects} = $graphs; 
}


#--------------------------------------------------------------------------------

sub init {
  my $self = shift;
  my $args = ref $_[0] ? shift : {@_};

  $self->SUPER::init($args);

  # Defaults
  $self->setScreenSize(225);
  return $self;
}

#--------------------------------------------------------------------------------

sub makeRPlotStrings {
  my ($self) = @_;

  my $graphObjects = $self->getGraphObjects();
  my $ms = $self->getMultiScreen();
  my %isVis_b = $ms->partIsVisible();

  my @rv;

  foreach my $plotPart (@$graphObjects) {
    my $partName = $plotPart->getPartName();
    next unless ($isVis_b{$partName});

    my $idType = $self->getIdType();

    if($self->getCompact()) {
      $plotPart->setIsCompact(1);
    }

    push @rv, $plotPart->makeRPlotString($idType);

    my $profileSets = $plotPart->getProfileSets();

    my @profileFiles = map { $_->getProfileFile() } @$profileSets;


    my @profileSetNames = map { $_->getDisplayName() } @$profileSets;

    my @elementNamesFiles = map { $_->getElementNamesFile() } @$profileSets;

    my @stderrProfileSets = map { $_->getRelatedProfileSet() } @$profileSets;
    my @stderrFiles;
    foreach(@stderrProfileSets) {
      if($_) {
        push @stderrFiles, $_->getProfileFile();
      }
    }

    foreach my $file (@profileFiles, @elementNamesFiles, @stderrFiles) {
      $self->addTempFile($file) if($file);
    }
    if($self->getFormat() eq 'table') {
      $self->addToProfileDataMatrix(\@profileFiles, \@elementNamesFiles, \@profileSetNames);
    }
  }
  
  if($self->getFormat() eq 'table') {
    $self->makeHtmlStringFromMatrix();
  }

  return \@rv;
}

#--------------------------------------------------------------------------------


1;
