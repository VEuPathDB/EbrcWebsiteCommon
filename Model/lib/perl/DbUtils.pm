package EuPathSiteCommon::Model::DbUtils;
require Exporter;
@ISA = qw(Exporter);
@EXPORT_OK = qw(
    resolveOracleDSN
    resolveOracleAlias
    jdbc2oracleDbi
    jdbc2postgresDbi
    dbi2connectString
    );

=head1 NAME

EuPathSiteCommon::Model::DbUtils - utility methods for database 
connection configuration.

=cut

use strict;
use DBI 1.43;

=head1 METHODS


=head2 resolveOracleDSN

 Usage : my $newDsn = DbUtils->resolveOracleDSN($dsn);
 Returns : DSN with the Oracle alias resolved by the 
 Oracle utility 'tnsping'

 Expand the Oracle DSN by resolving the tnsname.
 Useful for working around issue where Apache segfaults or 
 other errors occur when letting DBD::Oracle do tnsname resolution  
 via LDAP in Mod::Registry scripts. The Apache segfaults are
 avoided if the name is pre-resolved before handing it to DBD::Oracle.

=over 4

 my $newDsn = DbUtils->resolveOracleDSN('dbi:Oracle:cryptoA');
 print $newDsn;
 dbi:Oracle():(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=ahost.xyz.uga.edu)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SERVICE_NAME=ahost.xyz.uga.edu)))

=cut
sub resolveOracleDSN {
    my ($class, $dsn) = @_;
    my ($scheme, $driver, $attr_string, $attr_hash, $driver_dsn) = DBI->parse_dsn($dsn);
    my $tnsname = $class->resolveOracleAlias($driver_dsn);
    return   ( ($scheme) && "$scheme:" ) .
             ( ($driver) && "$driver"  ) .
             ( ($attr_string) ? "($attr_string):" : ':'  ) .
             $tnsname;
}

=head2 resolveOracleAlias

 Usage : my $name = DbUtils->resolveOracleAlias($alias);
 Returns : the Oracle alias as resolved by the Oracle utility 
 'tnsping'
 
 See resolveOracleDSN() for possible use case.

 my $name = DbUtils->resolveOracleDSN('cryptoA');
 print $name;
 (DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=ahost.xyz.uga.edu)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SERVICE_NAME=ahost.xyz.uga.edu)))

=cut
sub resolveOracleAlias {
    my ($class, $alias) = @_;
    return qx{ 
        $ENV{ORACLE_HOME}/bin/tnsping '$alias' | \
        grep 'Attempting to contact' | \
        sed 's/Attempting to contact //'
    };
}

=head2 jdbc2oracleDbi

 Usage : my $name = DbUtils->jdbc2oracleDbi($jdbcConnectUrl);
 Returns : dbi syntax converted from Oracle thin jdbc driver syntax

 my $name = DbUtils->jdbc2oracleDbi('jdbc:oracle:thin:@redux.rcc.uga.edu:1521:cryptoB');
 print $name;
 dbi:Oracle:@redux.rcc.uga.edu:1521:cryptoB

=cut
sub jdbc2oracleDbi {
    my ($jdbc) = @_;
    
    if ($jdbc =~ m/thin:[^@]*@([^:]+):([^:]+):([^:]+)/) {
        # jdbc:oracle:thin:@redux.rcc.uga.edu:1521:cryptoB
        my ($host, $port, $sid) = $jdbc =~ m/thin:[^@]*@([^:]+):([^:]+):([^:]+)/;
        return "dbi:Oracle:host=$host;sid=$sid;port=$port";
    } elsif ($jdbc =~ m/@\(DESCRIPTION/i) {    
        # jdbc:oracle:thin:@(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=redux.rcc.uga.edu)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SERVICE_NAME=cryptoB.rcc.uga.edu)))
        my ($tns) = $jdbc =~ m/[^@]+@(.+)/;
        return "dbi:Oracle:$tns";
    } elsif ($jdbc =~ m/:oci:@/) {
       # jdbc:oracle:oci:@toxoprod
       my ($sid) = $jdbc =~ m/:oci:@(.+)/;
        return "dbi:Oracle:$sid";
    } else {
        # last ditch effort.
        # jdbc:oracle:thin:@kiwi.rcr.uga.edu/cryptoB.kiwi.rcr.uga.edu
        $jdbc =~ m/thin:[^@]*@(.+)/;
        return "dbi:Oracle:$1";
    }
}

=head2 jdbc2postgresDbi

 Usage : my $name = DbUtils->jdbc2postgresDbi($jdbcConnectUrl);
 Returns : dbi syntax converted from Postgres jdbc driver syntax

 my $name = DbUtils->jdbc2postgresDbi('jdbc:postgresql://myhost:5432/mydatabase');
 print $name;
 dbi:Pg:dbname=mydatabase;host=myhost;port=5432;

=cut
sub jdbc2postgresDbi {
    my ($jdbc) = @_;
   
    # check for jdbc:postgresql://host:port/database
    if ($jdbc =~ m/postgresql:\/\/([^:\/]+):([0-9]+)\/(.+)/) {
    	my ($host, $port, $db) = $jdbc =~ m/postgresql:\/\/([^:\/]+):([0-9]+)\/(.+)/;
        return "dbi:Pg:dbname=$db;host=$host;port=$port";
    }
    # check for jdbc:postgresql://host/database
    elsif ($jdbc =~ m/postgresql:\/\/([^\/]+)\/(.+)/) {
    	my ($host, $db) = $jdbc =~ m/postgresql:\/\/([^\/]+)\/(.+)/;
    	return "dbi:Pg:dbname=$db;host=$host";
    }
    # check for jdbc:postgresql:database
    elsif ($jdbc =~ m/postgresql:\/\/(.+)/) {
    	my ($db) = $jdbc =~ m/postgresql:\/\/(.+)/;
    	return "dbi:Pg:dbname=$db";
    }
    # return empty string if no match
    return "";
}

1;
