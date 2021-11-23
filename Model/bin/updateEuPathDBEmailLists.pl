#!/usr/bin/perl

use strict;
use Getopt::Long;
use Mail::Send;
use lib "$ENV{GUS_HOME}/lib/perl";

my($email,$passwd,$verbose, $suppressUpdate);
my $projectId = 'PlasmoDB';

&GetOptions("email|e=s"=> \$email,  ## email address of list admin
            "passwd|p=s" => \$passwd,  ## passwd of list admin
            "projectName|n=s" => \$projectId,  ## project name of website that is configured eg. PlasmoDB 
            "suppressUpdate|s!" => \$suppressUpdate,  ## include this for testing ... doesn't send the emails
            "verbose|v!" => \$verbose,
            );

my $listAddress = 'listserv@lists.upenn.edu';

die "email|e address of admin sender required\n" unless $email;
die "password|p of admin required\n" unless $passwd;

my $dbh = getDbHandle();

print STDERR "SQL:\n",&getSQL()."\n" if $verbose;

my $statement = $dbh->prepare(&getSQL);
$statement->execute();

my %data;
my %eupath;
my $count = 0;
while(my @row = $statement->fetchrow_array()){
  $count++;
  print STDERR "Processing record $count\n" if $verbose && $count % 1000 == 0;
  $row[2] =~ s/preference_global_email_//g;
  my $emailName = "$row[0]\t$row[1]";
  push(@{$data{$row[2]}},$emailName);
  $eupath{$emailName} = 1;
}

$statement->finish();

foreach my $key (keys%data){
  next if ($key eq 'apidb' || $key eq 'ortho');
##  next unless $key eq 'schistodb';  ## uncomment for testing
  my $list = $key . "_users";
  my $body = "QUIET DEL $list * PW=$passwd\n\nQUIET ADD $list DD=ddname IMPORT PW=$passwd\n//ddname DD *\n";
  print STDERR "Processing $list: ",scalar(@{$data{$key}}), " distinct email addresses\n";
  foreach my $em (@{$data{$key}}){
    $body .= "$em\n";
  }
  $body .= "/*\n";
  
  &sendMail($body, $email, $listAddress) unless $suppressUpdate;
}

##do eupathdb_all .... keys%eupath
my $list = 'eupathdb_all';
my $body = "QUIET DEL $list * PW=$passwd\n\nQUIET ADD $list DD=ddname IMPORT PW=$passwd\n//ddname DD *\n";
print STDERR "Processing $list: ",scalar(keys%eupath)," distinct email addresses\n";
foreach my $em (keys%eupath){
  $body .= "$em\n";
}
$body .= "/*\n";

&sendMail($body,$email, $listAddress) unless $suppressUpdate;

sub getSQL {
  return "select u.email, first.value || ' ' || last.value as name, p.preference_name
from userlogins5.preferences\@prods.login_comment p, useraccounts.accounts\@acctdbs.profile u, useraccounts.account_properties\@acctdbs.profile first, useraccounts.account_properties\@acctdbs.profile last 
where u.last_login is not null
and u.user_id = p.user_id
and p.preference_name like '%email%'
and first.user_id = u.user_id
and first.key = 'first_name'
and last.user_id = u.user_id
and last.key = 'last_name'
UNION
select u.email, first.value || ' ' || last.value as name, p.preference_name
from userlogins5.preferences\@ceprods.login_comment p, useraccounts.accounts\@acctdbs.profile u, useraccounts.account_properties\@acctdbs.profile first, useraccounts.account_properties\@acctdbs.profile last 
where u.last_login is not null
and u.user_id = p.user_id
and p.preference_name like '%email%'
and first.user_id = u.user_id
and first.key = 'first_name'
and last.user_id = u.user_id
and last.key = 'last_name'";
}

sub getDbHandle {
   
  my ($dbh, $dsn, $login, $passwd);
  
    
  require WDK::Model::ModelConfig;
  my $c = new WDK::Model::ModelConfig($projectId);

  my $cfg = new WDK::Model::ModelConfig($projectId);
  
  $dsn    = $cfg->getAppDb->getDbiDsn;
  $login  = $cfg->getAppDb->getLogin;
  $passwd = $cfg->getAppDb->getPassword;

##  die "You must run this on apicomm(n|s), not an apicommdev instance\n" if $dsn =~ /dev/i;
  
  $dbh = DBI->connect(
                      $dsn, 
                      $login, 
                      $passwd,
                      { PrintError => 1, RaiseError => 0}
                     ) or die "Can't connect to the database: $DBI::errstr\n";
  

  print "db info:\n  dsn=$dsn\n  login=$login\n\n" if $verbose;
  return $dbh;
  
}

sub sendMail {
    my ($message, $from, $to) = @_;

    my $msg = new Mail::Send (Subject=>'Update list',
			      To=>$to);
    $msg->set('From', $from);
    # my $fh = $msg->open;               # some default mailer
    my $fh = $msg->open('sendmail'); # explicit
    print $fh $message;
    $fh->close;         # complete the message and send it

    if ($?) {
      print STDERR "Sorry your message was not sent: $!\n";
    } else {
      print STDERR "Your message has been sent.\n";
    }
}
