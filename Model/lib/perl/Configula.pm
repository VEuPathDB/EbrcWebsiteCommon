package EuPathSiteCommon::Model::Configula;


=head1 NAME

EuPathSiteCommon::Model::Configula - core methods for configula script

=head1 DESCRIPTION

This module is for use by the WDK team to aid internal development.

=cut

use strict;
use warnings FATAL => qw( all );
use File::Basename;
use Cwd qw(realpath);
use DBI;
use XML::Twig;
use XML::Simple;
use Getopt::Long;
use YAML qw(LoadFile);

our $scriptname = basename ( (caller(0))[1] );

my %dblinkMap = (
    'apicomms'    => 'prods.login_comment',
    'apicommn'    => 'prodn.login_comment',
    'apicommdevs' => 'devs.login_comment',
    'apicommdevn' => 'devn.login_comment',
);

sub new {
    my ($class, $opts) = @_;

    my $self = {};
    bless $self;

    my $modelName = $opts->{'modelName'};

    my (
      $appDb_login,
      $appDb_database,
      $userDb_database,
      $target_site,
      $g_use_map,
      $g_skip_db_test,
    ) = get_cli_args();
    
    $self->{'user_has_specified_values'} = defined ($appDb_login || $appDb_database || $userDb_database);
    $self->{'g_use_map'} = $g_use_map || undef;

    my $web_base_dir = '/var/www';
    my $site_symlink = "$web_base_dir/$target_site";
    my $product = dirname(readlink $site_symlink);
    my $project_home = realpath("$site_symlink/project_home");
    my $gus_home = realpath("$site_symlink/gus_home");
    my $site_etc = realpath("$site_symlink/etc");
    my $wdk_config_dir = "$gus_home/config";
    my $wdk_product_config_dir = "$gus_home/config/$product";

    my $webapp = basename(readlink $site_symlink);
    my ($webapp_nover) = $webapp =~ m/(^[a-zA-Z_]+)/;
    
    # read for product version number. Use the source because it may not
    # yet be present at the dest (e.g. if --usemap is specified but no map data found)
    my $wdk_model_xml = "$gus_home/lib/wdk/${modelName}.xml";
    my %build_numbers = $self->build_numbers($wdk_model_xml);
    my %site_versions = $self->site_versions($wdk_model_xml);


    my $userDb_login = 'uga_fed';

    $self->{'g_skip_db_test'} = $g_skip_db_test;
    $self->{'target_site'} = $target_site;
    $self->{'appDb_login'} = $appDb_login;
    $self->{'userDb_login'} = $userDb_login;
    $self->{'appDb_database'} = $appDb_database || undef;
    $self->{'userDb_database'} = $userDb_database || undef;
    $self->{'euparc'} = $self->find_euparc();
    $self->{'map_file'} = "$site_etc/master_configuration_set";
    $self->{'meta_config_file'} = "${site_etc}/metaConfig_${scriptname}";
    $self->{'webapp'} = $webapp;
    $self->{'webapp_nover'} = $webapp_nover;
    $self->{'web_base_dir'} = $web_base_dir;
    $self->{'site_symlink'} = $site_symlink;
    $self->{'product'} = $product;
    $self->{'project_home'} = $project_home;
    $self->{'gus_home'} = $gus_home;
    $self->{'site_etc'} = $site_etc;
    $self->{'wdk_config_dir'} = $wdk_config_dir;
    $self->{'wdk_product_config_dir'} = $wdk_product_config_dir;
    $self->{'wdk_model_xml'} = $wdk_model_xml;
    $self->{'site_version'} = $site_versions{$self->{'product'}};
    $self->{'build_number'} = $build_numbers{$self->{'product'}};
    $self->{'common_webservices_dir'} = (-e "/var/www/Common/prodSiteFilesMirror") ?
                                        "Common/prodSiteFilesMirror/webServices" :
                                        "Common/devSiteFilesMirror/webServices";
    $self->{'webservice_files_mirror'} = "$self->{'web_base_dir'}/$self->{'common_webservices_dir'}";
    $self->{'rls_webservice_data_dir'} = "$self->{'webservice_files_mirror'}/$self->{'product'}/build-$self->{'build_number'}";
    $self->{'server_hostname'} = qx(/bin/hostname);
    $self->{'host_class'} = $self->host_class($self->{'target_site'});
    $self->{'host_class_prefix'} = $self->{'host_class'} ? $self->{'host_class'} . '.' : '';

    if ($self->{'g_use_map'}) {
        open(my $fh, $self->{'map_file'}) or die $!;
        my @hits = grep /^$self->{'target_site'}/, <$fh>;
        ($self->{'site'}, $self->{'appDb_database'},  $self->{'userDb_database'}, $self->{'appDb_login'},  $self->{'userDb_login'}) = split(/\s+/, $hits[0]);
        print "<$scriptname> using '$self->{'appDb_login'}\@$self->{'appDb_database'}',  '$self->{'userDb_login'}\@$self->{'userDb_database'}'\n";
        if ( ! ($self->{'appDb_login'} && $self->{'appDb_database'} && $self->{'userDb_database'}) ) {
            die "$self->{'map_file'} does not have sufficient data for $self->{'target_site'}. Quitting with no changes made.\n";
        }
    }

    $self->{'userDbLink'} = $dblinkMap{lc($self->{'userDb_database'})};
    
    $self->{'appDb_password'} = $self->std_password($self->{'euparc'}, $self->{'appDb_login'}, $self->{'appDb_database'});
    
    if ( ! $self->{'appDb_password'} ) {
      die "Did not find password for $self->{'appDb_login'} in $self->{'euparc'} . Quitting with no changes made.\n";
    }
    
    $self->{'userDb_login'} = $self->{'userDb_login'} || 'uga_fed';
    $self->{'userDb_password'} = $self->std_password($self->{'euparc'}, $self->{'userDb_login'}, $self->{'userDb_database'});;
    
    if ( ! $self->{'userDb_password'} ) {
      die "Did not find password for $appDb_login in $self->{'euparc'} . Quitting with no changes made.\n";
    }
    
    # webapp_nover is always valid thanks to apache redirects, and
    # is especially desired for production sites
    $self->{'webServiceUrl'} = 'http://' . $self->{'target_site'} . '/' . $self->{'webapp_nover'} . '/services/WsfService';
    
    $self->sanity_check();
    
    return $self;
}


####################################################################
# pre-flight sanity checks
####################################################################
sub sanity_check {
    my ($self) = @_;
    if ( $self->{'g_use_map'} && $self->{'user_has_specified_values'}) {
        die "can not set specific values when using --usemap\n";;
    }
    
    if ($self->{'g_use_map'}) {
        die "--usemap chosen but $self->{'map_file'} not found\n" unless ( -r $self->{'map_file'});
    }

    die "\nFATAL: I do not know what dblink to use for '" . lc $self->{'userDb_database'} . "'\n" .
      "  I know about: " . join(', ', keys(%dblinkMap)) . "\n\n"
      if ( ! $self->{'userDbLink'} || $self->{'userDbLink'} eq '@');

    if ( ! $self->{'g_skip_db_test'}) {
      $self->testDbConnection($self->{'appDb_login'}, $self->{'appDb_password'}, $self->{'appDb_database'});
      $self->testDbConnection($self->{'userDb_login'}, $self->{'userDb_password'}, $self->{'userDb_database'});
    }


#      if (! -d $self->{'webservice_files_mirror'}) {
#        warn "\nWARN: '$self->{'webservice_files_mirror'}' does not exist\n\n";
#      } elsif (! -d $self->{'rls_webservice_data_dir'}) {
#        warn "\nWARN: '$self->{'rls_webservice_data_dir'}' does not exist. \n" .
#           "  Check that buildNumber '$self->{'build_number'}' in \n".
#           "  '$self->{'wdk_model_xml'}'\n" .
#           "  matches build-N directory.\n\n";
#      }
}


sub do_configure {
  my ($self, $product, $meta_config_file) = @_;
  
  my $short_cmd = 'eupathSiteConfigure';
  my $cmd = "$self->{'gus_home'}/bin/$short_cmd -model $product -filename $meta_config_file";
  print "<$scriptname> Attempting: '$cmd' ...";
  system("$cmd");
  if ($? == 0) {
    print "<$scriptname> OK\n";
  } elsif ($? == -1) {
    print "\n<$scriptname> FATAL: $!\n";
    exit -1;
  } else {
    print "\n<$scriptname> FATAL: $short_cmd exited with status " . ($? >> 8) . "\n";
    exit ($? >> 8);
  };
}

sub get_cli_args {
  my ($self) = @_;

  my (
    $appDb_login,
    $appDb_database,
    $userDb_database,
    $target_site,
    $g_use_map,
    $g_skip_db_test,
  );

  {
    local $SIG{__WARN__} = sub { 
      my $message = shift;
      die "<$scriptname> FATAL: " . $message;
    };
  
  my $optRslt = GetOptions(
        "alogin=s"   => \$appDb_login,
        "adb=s"      => \$appDb_database,
        "udb=s"      => \$userDb_database,
        "usemap"     => \$g_use_map,  # get config data from a master file from gus_home/config
        "skipdbtest" => \$g_skip_db_test, # for when you know this will fail, or know it will succeed!
      );
  }
  
  $target_site = lc $ARGV[0];

  return (
    $appDb_login,
    $appDb_database,
    $userDb_database,
    $target_site,
    $g_use_map,
    $g_skip_db_test,
  ); 
}

sub dblink {
    my ($self, $apicomm) = @_;
    my %dblinkMap = (
        'apicomms'    => 'prods.login_comment',
        'apicommn'    => 'prodn.login_comment',
        'apicommdevs' => 'devs.login_comment',
        'apicommdevn' => 'devn.login_comment',
    );
    
    return  $dblinkMap{lc($apicomm)};
}

# retreive password from users ~/.euparc
sub std_password {
  my ($self, $euparc, $login, $database) = @_;

  ($login, $database) = map{ lc } ($login, $database);

  my $rc = XMLin($euparc,
      ForceArray => ['user'],
      ForceContent => 1,
      KeyAttr => [ user => "login"],
      ContentKey => '-content',
  );
  
  return $rc->{database}->{$database}->{user}->{$login}->{password} ||
      $rc->{database}->{user}->{$login}->{password};
}

# return 'class' of host, e.g. qa, beta, integrate or hostname.
# This is not always the hostname. A site with 'q1' hostname is a 'qa' class.
sub host_class {
  my ($self, $target_site) = @_;
  my ($host_class) = $target_site =~ m/^([^\.]+)\./;
  $host_class = 'qa' if $host_class =~ m/^q/;
  $host_class = 'beta' if $host_class =~ m/^b/;
  $host_class = '' if $host_class =~ m/^w/;
  return $host_class;
}

sub webapp_domain_map {
  my ($self) = @_;
  return {
      'amoeba'    => 'amoebadb.org',
      'cryptodb'  => 'cryptodb.org',
      'eupathdb'  => 'eupathdb.org',
      'fungidb'   => 'fungidb.org',
      'giardiadb' => 'giardiadb.org',
      'micro'     => 'microsporidiadb.org',
      'piro'      => 'piroplasmadb.org',
      'plasmo'    => 'plasmodb.org',
      'toxo'      => 'toxodb.org',
      'trichdb'   => 'trichdb.org',
      'tritrypdb' => 'tritrypdb.org',
  };
}

sub domain_from_webapp {
  my ($self, $webapp) = @_;
  my ($webapp_nover) =  $webapp =~ m/(^[a-zA-Z_]+)/;
  my $map = webapp_domain_map();
  return $map->{$webapp_nover};
}

sub webapp_from_domain {
  my ($self, $domain) = @_;
  my $map = webapp_domain_map();
  my %revmap = reverse %$map;
  return $revmap{lc $domain};
}

sub site_versions {
  my($self, $wdk_model_xml) = @_;
  my %site_versions;
  my $acm = new XML::Twig( 
      keep_spaces => 1, 
      PrettyPrint => 'nice',
      keep_atts_order => 1,
      TwigHandlers => {
        'constant[@name="releaseVersion"]'  => sub { 
           $site_versions{$_[1]->att("includeProjects")} = $_[1]->text;
         },
      }
  );
  $acm->parsefile("$wdk_model_xml");
  return %site_versions;
}

# The buildNumber settings can be defined in aggregate as includeProjects
#  <constant name="buildNumber" includeProjects="PiroplasmaDB,TriTrypDB,TrichDB,ToxoDB,PlasmoDB,MicrosporidiaDB,AmoebaDB,CryptoDB,EuPathDB,GiardiaDB">16</constant>
#  <constant name="buildNumber" includeProjects="FungiDB">4</constant>
#  <constant name="buildNumber" includeProjects="InitDB">0</constant>
# So have to iterate.
sub build_numbers {
  my($self, $wdk_model_xml) = @_;
  my %aggregate_build_numbers;
  my %build_numbers;
  my $acm = new XML::Twig( 
      keep_spaces => 1, 
      PrettyPrint => 'nice',
      keep_atts_order => 1,
      TwigHandlers => {
        'constant[@name="buildNumber"]'  => sub { 
           $aggregate_build_numbers{$_[1]->att("includeProjects")} = $_[1]->text;
         },
      }
  );
  $acm->parsefile("$wdk_model_xml");
  
  # We now have a hash like
  #    'PiroplasmaDB,TriTrypDB,TrichDB,ToxoDB' => 15,
  #    'FungiDB' => 4,
  # Split the keys on commas.
  for my $projects_included (keys %aggregate_build_numbers) {
      #  $projects_included == 'PiroplasmaDB,TriTrypDB,TrichDB,ToxoDB'
      my @include_projects = split(',', $projects_included); 
      for my $project (@include_projects) {
          $build_numbers{$project} = $aggregate_build_numbers{$projects_included};
      }
  }

  return %build_numbers;
}

sub testDbConnection {
  my ($self, $login, $password, $db) = @_;
  my $dbh = DBI->connect("dbi:Oracle:$db", $login, $password, {
        PrintError =>0,
        RaiseError =>0
      }) or warn "\n<$scriptname> WARN: Can't connect to $db with $login: $DBI::errstr\n\n";;
  $dbh->disconnect if $dbh;
}

sub find_euparc  {
  my ($self) = @_;
  # ibuilder shell sets HOME to be the website and 
  # REAL_HOME to that of joeuser
  if ( defined $ENV{REAL_HOME} && -r "$ENV{REAL_HOME}/.euparc") {
      return "$ENV{REAL_HOME}/.euparc";
  } elsif ( -r "$ENV{HOME}/.euparc") {
      return "$ENV{HOME}/.euparc";
  }
  die "Required .euparc file not found\n";
}

# Compare metaConfig.yaml.sample with given metaconfig file,
# checking for missing or extra properties, indicating that
# either the sample or this script needs to be updated.
sub validate_meta_config {
  my ($self, $sample, $meta_config) = @_;
  my @required_not_found;
  my @extra_found;

  print "\n<$scriptname>  Validating the required properties in\n $meta_config\nagainst\n $sample\n\n";
  
  my ($sample_settings) = LoadFile($sample);
  my $meta_settings = LoadFile($meta_config);

  for my $property (keys %{$sample_settings->{'required'}}) {
    if ( ! defined $meta_settings->{'required'}->{$property} ) {
      push @required_not_found, $property;
    }
  }

  for my $property (keys %{$meta_settings->{'required'}}) {
    if ( ! defined $sample_settings->{'required'}->{$property} ) {
      push @extra_found, $property;
    }
  }

  if (scalar(@required_not_found) > 0 || scalar(@extra_found) > 0) {
    if (scalar(@required_not_found) > 0) {
      print "\n";
      print "<$scriptname> Fatal: Required properties not found:\n";
      print join("\n", @required_not_found);
    }
    print "\n";
    if (scalar(@extra_found) > 0) {
      print "\n";
      print "<$scriptname> Fatal: Found properties not required:\n";
      print join("\n", @extra_found);
    }
    print "\n";
    print "Resolve this in either\n";
    print " $sample\n";
    print "or the meta config file generation in the '$scriptname' script.\n";
    exit 1;
  }

}

sub write_meta_config {
  my ($self, $content) = @_;
  open(MC, ">$self->{'meta_config_file'}") or die "could not open $self->{'meta_config_file'} for writing.\n";
  print MC $content;
  close MC;
}
1;