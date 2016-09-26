package EuPathSiteCommon::Model::ModelProp;

use strict;
use XML::Simple;

sub new {
    my ($class, $model) = @_;
    my $self = {};
    bless $self;
        
    my $propfile = "$ENV{GUS_HOME}/config/${model}/model.prop";

    my $prop = $self->_parseProp($propfile);
    
    for (keys %$prop) {
        $self->{$_} = $prop->{$_}
    }
    
    return $self;
}

sub AUTOLOAD {
    my $attr = our $AUTOLOAD;
    $attr =~ s/.*:://;
    $attr =~ s/get([A-Z])/$1/;
    $_[0]->{ $attr } || die "`$attr' not defined.";
}

sub _parseProp {
    my ($self, $propfile) = @_;

    open(PROP, "<$propfile") or die "could not open '$propfile' for reading.\n";
    my $prop = {};
    while (<PROP>) {
        chomp;
        s/#.*//;
        s/^\s+//;
        s/\s+$//;
        next unless length;
        my ($key, $value) = split(/\s*=\s*/, $_, 2);
        $prop->{$key} = $value;
    }
    
    return $prop;
}

1;

__END__

=head1 NAME

EuPathSiteCommon::Model::ModelProp - access to WDK model.prop

=head1 SYNOPSIS

    use EuPathSiteCommon::Model::ModelProp;

    my $prop = new EuPathSiteCommon::Model::ModelProp('TrichDB');
    
    my $loginschema = $prop->{LOGIN_SCHEMA};
    
=head1 DESCRIPTION

Provides Perl access to properties in a WDK model.prop file.

=head1 BUGS


=head1 AUTHOR 

Mark Heiges, mheiges@uga.edu

=cut

=head1 METHODS

=head2 new

 Usage   : my $prop = new EuPathSiteCommon::Model::ModelProp('TrichDB');
 Returns : object containing data parsed from the model property file.
 Args    : the name of the model. This follows the name convention used for
           the WDK commandline utilities. This is used to find the Model's 
           property file ($GUS_HOME/config/{model}/model.prop)


 
=cut

