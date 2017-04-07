package EbrcWebsiteCommon::Model::CommentConfig;

use strict;
use XML::Simple;
use WDK::Model::DbUtils qw(jdbc2oracleDbi dbi2connectString);

sub new {
    my ($class, $model) = @_;
    my $self = {};
    bless $self;
   
    my $commentconfig = "$ENV{GUS_HOME}/config/${model}/comment-config.xml";
    (-e $commentconfig) or die "File not found: $commentconfig\n";

    my $cfg = XMLin($commentconfig);
    
    for (keys %$cfg) {
        $self->{$_} = $cfg->{$_}
    }
    
    $self->{dbiDsn} = jdbc2oracleDbi($self->{connectionUrl});

    ($self->{connectString} = $self->{dbiDsn}) =~ s/dbi:Oracle://;

    return $self;
}

sub AUTOLOAD {
    my $attr = our $AUTOLOAD;
    $attr =~ s/.*:://;
    return if $attr =~ /^[A-Z]+$/;  # skip methods such as DESTROY
    $attr =~ s/get([A-Z])/$1/;
    $attr = lcfirst($attr);
    $_[0]->{ $attr } || die "`$attr' not defined.";
}


1;

__END__

=head1 NAME

EbrcWebsiteCommon::Model::CommentConfig - access to WDK comment-config.xml properties

=head1 SYNOPSIS

    use EbrcWebsiteCommon::Model::CommentConfig;

    my $cfg = new EbrcWebsiteCommon::Model::CommentConfig('TrichDB');
    
    my $username = $cfg->getLogin;
    my $password = $cfg->getPassword;

    Retrieve the JDBC connectionUrl converted to Perl DBI syntax:
    my $dsn = $cfg->getDbiDsn;
    

    You may also access by property name:
        $cfg->login
    
    $cfg->connectionUrl is the JDBC connection string as written in the 
    comment-config.xml.
    $cfg->dbiDsn is the Perl DBI version translated from the 
    connectionUrl property.
    
=head1 DESCRIPTION

Provides Perl access to properties in a WDK comment-config.xml file.

=head1 BUGS

=head1 AUTHOR 

Mark Heiges, mheiges@uga.edu

=cut

=head1 METHODS

=head2 new

 Usage   : my $cfg = new EbrcWebsiteCommon::Model::CommentConfig('TrichDB');
 Returns : object containing data parsed from the WDK comment configuration file.
 Args    : the name of the model. This follows the name convention used for
           the WDK commandline utilities. This is used to find the Model's 
           configuration XML file ($GUS_HOME/config/{model}/comment-config.xml)

=head2 getLogin
 
 Usage : my $username = $cfg->getLogin;
 Returns : login name for the database
 
=head2 getPassword
 
 Usage : my $passwd = $cfg->getPassword;
 Returns : login password for the database
 
=head2 getDbiDsn
 
 Usage : my $dsn = $cfg->getDbiDsn;
 Returns : perl dbi connection string. converted from the jdbc connection URL in the comment-config.xml
 Example : dbi:Oracle:host=redux.rcc.uga.edu;sid=trichsite
 
=head2 getConnectionUrl
 
 Usage : my $jdbcUrl = $cfg->getConnectionUrl;
 Returns : original jdbc connection string from comment-config.xml

=head2 getConnectString
 
 Usage : my $connect = $cfg->getConnectString;
 Returns : connect string suitable for non-DBI cases (e.g. sqlplus)


=head2 getPlatformClass     

=head2 getMaxQueryParams    

=head2 getMaxIdle           

=head2 getMaxWait           

=head2 getMaxActive         

=head2 getMinIdle           

=head2 getInitialSize       

=head2 getCommentSchema     

=head2 getProjectDbLink     

=head2 getCommentTextFileDir     

=head2 getCommentSchema     

 
=cut

