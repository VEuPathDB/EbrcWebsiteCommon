
package EbrcWebsiteCommon::View::CgiApp::DataPlotter;

=pod

=head1 Purpose

Plot (expression) data in GUS using R.

=head1 Remember!

This is intended as a CGI script.  When testing via the command line
set parameters using this format, 'type=mytype', rather than '--type
mytype'.

=head1 Details

Program takes these parameters:

=over 4

=item type  : string : type of plot to draw; tail of package name

=item id    : string : plots data for object with this ID

=item sid   : string : secondary id for plotting

=item fmt   : string : graphics format to output; [pdf,jpeg,png,gif,svg] defaults to png

=item quiet : int : when non-zero the MIME header and file contents are not output

=item save  : int : when non-zero the temporary files are saved

=back

=cut

# ========================================================================
# ----------------------------- Declarations -----------------------------
# ========================================================================

use strict;

use vars qw( @ISA );

@ISA = qw( EbrcWebsiteCommon::View::CgiApp );

use EbrcWebsiteCommon::View::CgiApp;

# ========================================================================
# --------------------------- Required Methods ---------------------------
# ========================================================================

# --------------------------------- run ----------------------------------

sub run {
	 my $Self = shift;
	 my $Cgi  = shift;

	 my $_qh         = $Self->getQueryHandle($Cgi);

	 my $pkg          = $Cgi->param('project_id');
	 my $type           = $Cgi->param('type');
	 $pkg = "EuPathDB" if ($type eq 'PathwayGenera');
	 my $id             = $Cgi->param('id');
	 my $sid            = $Cgi->param('sid');
	 my $wantLogged     = $Cgi->param('wl');
	 my $format         = $Cgi->param('fmt')    || 'png';
	 my $quiet_b        = $Cgi->param('quiet');
	 my $save_b         = $Cgi->param('save');
	 my $typeArg        = $Cgi->param('typeArg');
         my $template     = $Cgi->param('template');
         my $datasetId     = $Cgi->param('datasetId');

         my $widthOverride     = $Cgi->param('w');
         my $heightOverride     = $Cgi->param('h');
         my $compact     = $Cgi->param('compact');
         my $idType     = $Cgi->param('idType');

         my $declareParts     = $Cgi->param('declareParts');

         my $contXAxis = $Cgi->param('contXAxis');

         my $facet = $Cgi->param('facet');
         my @facets   = split(',', $facet || '');

         my $default    = $Cgi->param('default');

         my $thumbnail_b    = $Cgi->param('thumb');
         my @visibleParts   = split(',', $Cgi->param('vp') || '');

         my $visiblePartsAreFuzzy     = $Cgi->param('vpAreFuzzy');

	 my @errors;

	 push(@errors, 'model must be supplied') if not defined $pkg;
	 push(@errors, $pkg . ' is an unallowed value for Project_id arg') if ($pkg ne 'PlasmoDB' and $pkg ne 'ToxoDB' and $pkg ne 'GiardiaDB' and $pkg ne 'AmoebaDB' and $pkg ne 'TriTrypDB' and $pkg ne 'FungiDB' and $pkg ne 'CryptoDB' and $pkg ne 'PiroplasmaDB' and $pkg ne 'MicrosporidiaDB' and $pkg ne 'HostDB' and $pkg ne 'EuPathDB');
	 push(@errors, 'type must be supplied' ) if not defined $type;
	 push(@errors, 'id must be supplied'   ) if not defined $id;

	 if (@errors) {
			die join("\n", @errors);
	 }
	
	 # will declare this content type
	 my %contentType = ( png  => 'image/png',
                             pdf  => 'application/pdf',
                             jpeg => 'image/jpeg',
                             jpg  => 'image/jpeg',
                             gif  => 'image/gif',
                             table => 'text/html',
			     svg  => 'text/xml'
										 );

   # some GDD formats may be different from their formats
   my %gddFormat = ( 'jpg' => 'jpeg' );
   my $gddFormat = $gddFormat{$format} || $format;

	 # some extensions may be different from their format
	 my %extension = ( 'jpeg' => 'jpg', table => 'txt' );
	 my $ext = $extension{$format} || $format;

	 # write to these files.
	 my $fmt_f = "/tmp/dataPlotter-$$.$ext";

	 my @filesToDelete = ( $fmt_f );

	 $pkg = "Templates" if($template);

         my $class = "ApiCommonWebsite::View::GraphPackage::$pkg" . "::$type";
         if($pkg eq "ClinEpiDB" || $pkg eq "MicrobiomeDB") {
           $class = "EbrcWebsiteCommon::View::GraphPackage::$pkg" . "::$type";
         }

         # dataset Need to strip the dashes from package name
         my $datasetClassName = $datasetId;
         $datasetClassName =~ s/-//g if ($datasetClassName);

         eval "require $class";
         eval "import $class";

	 $class = $class . "::$datasetClassName" if($template);
         my $_gp = eval {
           $class->new({dataPlotterArg => $typeArg,
                        QueryHandle => $_qh,
                        Id => $id,
                        SecondaryId => $sid,
                        DatasetId => $datasetId,
                        WantLogged => $wantLogged,
                        Format => $gddFormat,
                        OutputFile => $fmt_f,
                        Thumbnail => $thumbnail_b,
                        DefaultPlotPart => $default,
                        VisibleParts => \@visibleParts,
                        Compact => $compact,
                        IdType => $idType,
                        WidthOverride => $widthOverride,
                        HeightOverride => $heightOverride,
                        VisiblePartsAreFuzzy => $visiblePartsAreFuzzy,
                        Facets => \@facets,
                        ContXAxis => $contXAxis,
                       });
         };

	 if ($@) {
           die "Unable to load driver for '$type': $@";
	 }

         if($declareParts) {
			print $Cgi->header(-Content_type => "text/plain");
           print $_gp->declareParts();
           return;
         }

	 my @files = $_gp->run();

	 push(@filesToDelete, @files);

	 # output the result; expiration date set to disable caching for
	 # now.

	 if (!$quiet_b) {
                       my $outputFile = $_gp->getOutputFile();


			print $Cgi->header(-Content_type => $contentType{$format},
                         -Cache_Control      => 'max-age=600',
                        );
			system "cat $outputFile";
	 }

	 # report or delete temporary files.
	 if ($save_b) {
      print STDERR join("\n", 'Files', @filesToDelete), "\n";
	 }
   else {
	  map {unlink $_ if $_} @filesToDelete;
   }
}

# ========================================================================
# ---------------------------- End of Package ----------------------------
# ========================================================================

1;
