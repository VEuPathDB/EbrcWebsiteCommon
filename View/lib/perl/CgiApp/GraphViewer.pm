package EbrcWebsiteCommon::View::CgiApp::GraphViewer;
@ISA = qw( EbrcWebsiteCommon::View::CgiApp );

use strict;
use EbrcWebsiteCommon::View::CgiApp;

use LWP::UserAgent;
use JSON;

use Data::Dumper;

sub run {
  my ($self, $cgi) = @_;

  my $projectId = $cgi->param('project_id');

  my $lcProjectId = lc($projectId);

  my $ua = LWP::UserAgent->new;
  push @{ $ua->requests_redirectable }, 'POST';


#TODO revisit once beta sites are live
  my $server_endpoint = "http://beta.$lcProjectId.org/a/service/record-types/dataset/searches/AllDatasets/reports/standard";

  my $req = HTTP::Request->new(POST => $server_endpoint);
  $req->header('content-type' => 'application/json');

  my $post_data = "{
  \"reportConfig\": {
    \"pagination\": {
      \"offset\": 0,
      \"numRecords\": 2000
    },
    \"sorting\": [{
      \"attributeName\": \"primary_key\",
      \"direction\": \"ASC\"
    }],
    \"tables\": [
      \"ExampleGraphs\"
    ]
  },
  \"searchConfig\": {\"parameters\": {}}
}";

  my @urls;

  $req->content($post_data);

  my $resp = $ua->request($req);

   print STDOUT $cgi->header();
  print STDOUT $cgi->start_html(-title => "GraphViewer",
      );

  if ($resp->is_success) {
    my $message = $resp->decoded_content;
#     print "Received reply: $message\n";

# experimentIdentifier,species,displayName,description,type,uri,significance
    # parse JSON string
    my $json = decode_json($message);

    foreach my $record (@{$json->{records}}) {
      my @values = $record->{tables}->{ExampleGraphs};
      foreach my $outer (@values) {
        foreach my $table (@$outer) {

          my $projectId = $table->{project_id};
          my $module = $table->{module};
          my $datasetId = $table->{dataset_id};
          my $template = $table->{template};
          my $defaultGraphId = $table->{default_graph_id};

          push @urls, "/cgi-bin/dataPlotter.pl?project_id=$projectId&id=$defaultGraphId&type=$module&fmt=png&template=$template&datasetId=$datasetId";
        }
      }
    }
  }  else {
    print "HTTP POST error code: ", $resp->code, "\n";
    print "HTTP POST error message: ", $resp->message, "\n";
  }

  print STDOUT $cgi->table( {}, (
              map {
                $cgi->Tr(
                $cgi->td("<img src=\"$_\""), $cgi->td("<img src=\"http://$lcProjectId.org$_\">")
            )
              } @urls

               ));


  print "\n";
    print STDOUT $cgi->end_html();
}
1;
