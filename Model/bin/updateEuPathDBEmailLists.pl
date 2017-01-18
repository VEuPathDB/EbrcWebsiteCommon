#!/usr/bin/perl

use strict;
use Getopt::Long;
use Mail::Send;
use lib "$ENV{GUS_HOME}/lib/perl";

my($email,$passwd,$gusConfigFile,$useWdkModel,$verbose, $suppressUpdate);
my $projectId = 'PlasmoDB';

&GetOptions("email|e=s"=> \$email,
            "passwd|p=s" => \$passwd,
            "gusConfigFile|g=s" => \$gusConfigFile,
            "useWdkModel|w!" => \$useWdkModel,
            "verbose|v!" => \$verbose,
            "suppressUpdate|s!" => \$suppressUpdate,
            );

my $listAddress = 'listserv@lists.upenn.edu';

die "email|e address of admin sender required" unless $email;
die "password|p of admin required" unless $passwd;
die "gusConfigFile|g required with database of apicomm" unless $gusConfigFile;

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
  return "select u.email,u.first_name || ' ' || u.last_name as name, p.preference_name
from userlogins5.preferences p, userlogins5.users u 
where u.last_active is not null
and u.user_id = p.user_id
and p.preference_name like '%email%'";
}

sub getDbHandle {
   
  my ($dbh, $dsn, $login, $passwd);
  
  if ($useWdkModel) {
    
    require EuPathSiteCommon::Model::CommentConfig;
    my $c = new EuPathSiteCommon::Model::CommentConfig($projectId);

    $dsn    = $c->getDbiDsn();
    $login  = $c->getLogin();
    $passwd = $c->getPassword();
    
    $dbh = DBI->connect(
                  $dsn, 
                  $login, 
                  $passwd,
                  { PrintError => 1, RaiseError => 0}
                  ) or die "Can't connect to the database: $DBI::errstr\n";
  
  } else {
  
    require GUS::ObjRelP::DbiDatabase;
    require GUS::Supported::GusConfig;
    
    my $gusconfig = GUS::Supported::GusConfig->new($gusConfigFile);
    
    $dsn    = $gusconfig->getDbiDsn();
    $login  = $gusconfig->getReadOnlyDatabaseLogin();
    $passwd = $gusconfig->getReadOnlyDatabasePassword();
    
    my $db = GUS::ObjRelP::DbiDatabase->new($dsn,
             $login,
             $passwd,
             $verbose,0,1,
             $gusconfig->getCoreSchemaName,
             $gusconfig->getOracleDefaultRollbackSegment());
    
    $dbh = $db->getQueryHandle();
  }

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
