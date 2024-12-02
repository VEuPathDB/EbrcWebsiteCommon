
package EbrcWebsiteCommon::View::CgiApp;

=pod

=head1 Purpose

Form a super-class for all cgi-bin webapps.

Note: you will have a cgi-bin command that wraps your CgiApp subclass.  To
call that cgi-bin command from the command line (for testing), use this
syntax:
  mycmd myparam1=some_value myparam2=some_value 

=cut

# ========================================================================
# ----------------------------- Declarations -----------------------------
# ========================================================================

use strict;

use CGI;
use CGI::Carp qw(fatalsToBrowser set_message);

use WDK::Model::ModelConfig;

use DBI;
use DBD::Oracle;

use sigtrap 'handler' => \&sigtrapXcpu, 'XCPU';

use Digest::MD5 qw(md5_hex);
my $uuid = md5_hex(localtime);


# ========================================================================
# ----------------------------- BEGIN Block ------------------------------
# ========================================================================

BEGIN {
    # Carp callback for sending fatal messages to browser
    sub handle_errors {
        my ($msg) = @_;
        print "<h3>Oops</h3>";
        # The website is considerd public if there is no WEBSITE_RELEASE_STAGE
        # environment variable defined or if it is defined and greater than
        # the value for an integration site. If public, do not show stacktrace
        # messages.
        my $isPublicSite = (
          ! defined $ENV{'WEBSITE_RELEASE_STAGE'} 
          || ($ENV{'WEBSITE_RELEASE_STAGE'} > 20));
        if ($isPublicSite) {
           print "<p>There was a problem running this service.<br> ";
           #print "If you report this problem please include this Error Tag: " . $uuid;
           print "Please contact us with the URL in your browser, the page you are working on. Thanks!"
        } else {
           print "<p>Got an error: <pre>$msg</pre>\n";
           print "<p>Error Tag: $uuid";
        }
    }
    set_message(\&handle_errors);
}

# ========================================================================
# ------------------------------ Main Body -------------------------------
# ========================================================================

# --------------------------------- new ----------------------------------

sub new {
     my $Class = shift;

     my $Self = bless {}, $Class;

     $Self->init(@_);

     return $Self;
}

# --------------------------------- init ---------------------------------

sub init {
     my $Self = shift;
     my $Args = ref $_[0] ? shift : {@_};
     
     my $projectId = $Self->cla()->param('project_id') 
            or die "project_id parameter not defined\n";
     
     $Self->setProjectId( $projectId );

     return $Self;
}


# ------------------------------ Accessors -------------------------------

sub getProjectId           { $_[0]->{'Model'} }
sub getModel               { $_[0]->{'Model'} }
sub setProjectId           { $_[0]->{'Model'} = $_[1]; $_[0] }

# ---------------------------------- go ----------------------------------

sub go {
     my $Self = shift;

     my $_cgi = $Self->cla();

     $Self->run($_cgi);
}

# --------------------------------- cla ----------------------------------

sub cla {
     my $Self = shift;

     my $Rv   = CGI->new();

     if (defined $Rv->param('help')) {
            usage();
            exit(0);
     }

     return $Rv;
}

# -------------------------------- usage ---------------------------------

sub usage {
     my $Self = shift;

     my $class_f = $INC{ref($Self). '.pm'};

     system "pod2text $0 $class_f";
}

# ---------------------------- getQueryHandle ----------------------------

sub getQueryHandle {
   my $Self = shift;

   my $Rv;

   my $_config = new WDK::Model::ModelConfig($Self->getProjectId());
                       
   $Rv = DBI->connect( $_config->getAppDbDbiDsn(),
                       $_config->getAppDbLogin(),
                       $_config->getAppDbPassword()
                     )
   || die "unable to open db handle to ", $_config->getAppDbDbiDsn();

   # solve oracle clob problem; not that we're liable to need it...
   $Rv->{LongTruncOk} = 0;
   $Rv->{LongReadLen} = 10000000;

   return $Rv;
}

# ---------------------------- sigtrapXcpu ----------------------------

sub sigtrapXcpu(){
 die "Exceeded CPU limit (RLimitCPU). (Error Tag: $uuid)\n";
}

# ========================================================================
# ---------------------------- End of Package ----------------------------
# ========================================================================

1;

