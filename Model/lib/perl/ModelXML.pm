package EbrcWebsiteCommon::Model::ModelXML;

use strict;
use XML::Twig;


sub getSiteVersions {$_[0]->{_site_versions}}
sub getBuildNumbers {$_[0]->{_build_numbers}}

sub getSiteVersionByProjectId {
  my ($self, $projectId) = @_;


  my $siteVersions = $self->getSiteVersions();

  if(my $siteVersion = $siteVersions->{$projectId}) {
    return $siteVersion;
  }
  die "No Release Version found for project $projectId";
}

sub getBuildNumberByProjectId {
  my ($self, $projectId) = @_;

  my $buildNumbers = $self->getBuildNumbers();

  if(my $buildNumber = $buildNumbers->{$projectId}) {
    return $buildNumber;
  }
  die "No Build Number found for project $projectId";
}

sub new {
  my ($class, $model_file) = @_;
  my $self = {};
  bless $self;

  my $model_file_fullpath = ($model_file =~ m,^/,) ?
    $model_file :
    "$ENV{GUS_HOME}/lib/wdk/$model_file";     
     
  if (! -f $model_file_fullpath) {
    die "No such file:\n'$model_file_fullpath'\n";
  }
  
  my %site_versions;
  my %build_numbers;

  my $twig = new XML::Twig(keep_spaces => 1,  
                           PrettyPrint => 'nice',
                           keep_atts_order => 1,
                           TwigHandlers => {
                             'constant[@name="releaseVersion"]'  => sub { 
                               $site_versions{$_[1]->att("includeProjects")} = $_[1]->text;
                             },  
                             'constant[@name="buildNumber"]'  => sub { 
                               $build_numbers{$_[1]->att("includeProjects")} = $_[1]->text;
                             },
                           }   
                           );  
  
  $twig->parsefile($model_file_fullpath); 


  foreach(keys %site_versions) {
    my $value = $site_versions{$_};
    my @a = split(/,/, $_);
    foreach(@a) {
      $site_versions{$_} = $value;
    }
  }

  foreach(keys %build_numbers) {
    my $value = $build_numbers{$_};
    my @a = split(/,/, $_);
    foreach(@a) {
      $build_numbers{$_} = $value;
    }
  }


  $self->{_site_versions} = \%site_versions;
  $self->{_build_numbers} = \%build_numbers;
  
  return $self;
}



1;

__END__

=head1 NAME

EbrcWebsiteCommon::Model::ModelXML - access to WDK Model XML

=head1 SYNOPSIS

    use EbrcWebsiteCommon::Model::ModelXML;
    my $model = EbrcWebsiteCommon::Model::ModelXML->new('apiCommonModel.xml');

    print $model->getBuildNumberByProjectId('AmoebaDB');
    print $model->getSiteVersionByProjectId('AmoebaDB');    

=head1 DESCRIPTION

Provides Perl access to selected values in a WDK model xml file.



=cut

=head1 METHODS

=head2 new

 Usage   : my $model = new EbrcWebsiteCommon::Model::ModelXML('apiCommonModel.xml');
 Returns : An object containing data parsed from the model xml file.
 Args    : The name of the model xml file. If only a filename is given 
           the path is assumed to be $GUS_HOME/lib/wdk. A full path may 
           also be provided.


=head2 getSiteVersionByProjectId

$model->getSiteVersionByProjectId('AmoebaDB');


=head2 getBuildNumberByProjectId

$model->getBuildNumberByProjectId('AmoebaDB');

=cut

