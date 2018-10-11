package EbrcWebsiteCommon::Model::CannedQuery;

# ========================================================================
# ----------------------------- Declarations -----------------------------
# ========================================================================

use strict;

use FileHandle;

use CBIL::Util::V;

use Data::Dumper;

# ========================================================================
# --------------------- Create, Init, and Accessors ----------------------
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

   $Self->setName                 ( $Args->{Name                } );
   $Self->setSql                  ( $Args->{Sql                 } );
	 $Self->setCollated             ( $Args->{Collated            } );
	 $Self->setScale                ( $Args->{Scale               } );
	 $Self->setOffset               ( $Args->{Offset              } );
   $Self->setFloor                ( $Args->{Floor               } );
   $Self->setCeiling              ( $Args->{Ceiling             } );
   $Self->setScaleY               ( $Args->{ScaleY              } );
   $Self->setElementOrder         ( $Args->{ElementOrder        } );

   return $Self;
}

# ------------------------------ accessors -------------------------------

sub getName                 { $_[0]->{'Name'                        } }
sub setName                 { $_[0]->{'Name'                        } = $_[1]; $_[0] }

sub getSql                  { $_[0]->{'Sql'               } }
sub setSql                  { $_[0]->{'Sql'               } = $_[1]; $_[0] }

sub getScale                { $_[0]->{'Scale'             } || 1.0 }
sub setScale                { $_[0]->{'Scale'             } = $_[1]; $_[0] }

sub getOffset               { $_[0]->{'Offset'            } || 0.0 }
sub setOffset               { $_[0]->{'Offset'            } = $_[1]; $_[0] }

sub getCollated             { $_[0]->{'Collated'          } }
sub setCollated             { $_[0]->{'Collated'          } = $_[1]; $_[0] }

sub getFloor                { $_[0]->{'Floor'             } }
sub setFloor                { $_[0]->{'Floor'             } = $_[1]; $_[0] }

sub getCeiling              { $_[0]->{'Ceiling'           } }
sub setCeiling              { $_[0]->{'Ceiling'           } = $_[1]; $_[0] }

sub getScaleY               { $_[0]->{'ScaleY'                      } }
sub setScaleY               { $_[0]->{'ScaleY'                      } = $_[1]; $_[0] }

sub getElementOrder         { $_[0]->{'ElementOrder'      } }
sub setElementOrder         { $_[0]->{'ElementOrder'      } = $_[1]; $_[0] }

# ========================================================================
# ---------------------------- Object Methods ----------------------------
# ========================================================================

# ---------------------------- expandMacroes -----------------------------

sub getExpandedSql {
   my $Self       = shift;
   my $Dictionary = shift;

   my $Rv = $Self->getSql();

   foreach my $macro (keys %$Dictionary) {
      my $expansion = $Dictionary->{$macro};
	if (defined $expansion) {
	  $Rv =~ s/<<$macro>>/$expansion/g;
	} else {
	  print STDERR join("\t", 'ERROR', 'Missing expansion', $macro,
	  $Self->getSql()), "\n";
	}
   }

   return $Rv;
}

# ------------------------------ getValues -------------------------------

sub getValues {
	 my $Self = shift;

	 if ($Self->getCollated()) {
			return $Self->getCollatedValues(@_);
	 } else {
			return $Self->getSimpleValues(@_);
	 }
}

# --------------------------- getSimpleValues ----------------------------

sub getSimpleValues {
  my $Self = shift;
  my $Qh   = shift;
  my $Dict = shift;

  my @Rv;

  my %table;

  # prepare dictionary
  $Dict = $Self->prepareDictionary($Dict);

  my $scale        = $Self->getScale()  || 1;
  my $offset       = $Self->getOffset() || 0;
  my $elementOrder = $Self->getElementOrder();

  # execute SQL and get result
  my $_sql = $Self->getExpandedSql($Dict);
  my $_sh  = $Qh->prepare($_sql);
  $_sh->execute();
  my $rows_n = 0;

  while (my $_row = $_sh->fetchrow_hashref()) {
    $rows_n++;
    my @keys = keys %$_row;

    # result contains a tab-delimited profile; split and pretend it
    # was separate rows.
    if (grep { $_ eq 'PROFILE_AS_STRING' } @keys) {
      #print STDERR Dumper($_row->{'PROFILE_AS_STRING'});
      my @profile = split /\t/, $_row->{'PROFILE_AS_STRING'};
      delete $_row->{'PROFILE_AS_STRING'};
      if (scalar @profile > 1) {

        if(defined $elementOrder) {
          foreach my $eo (@$elementOrder) {
            my $pseudo_row = { %$_row,
                               VALUE         => $Self->_treatValue($profile[$eo - 1]),
                               ELEMENT_ORDER => $eo,
                             };

            push(@Rv, $pseudo_row);
          }
        } else {

          for (my $i = 0; $i < @profile; $i++) {
            my $pseudo_row = { %$_row,
                               VALUE         => $Self->_treatValue($profile[$i]),
                               ELEMENT_ORDER => $i + 1,
            };

            push(@Rv, $pseudo_row);
          }
        }
      } else {
         $_row->{VALUE}          = $Self->_treatValue($profile[0]);

         if (defined $elementOrder) {
           #print STDERR Dumper(@$elementOrder[$rows_n]);
           $_row->{ELEMENT_ORDER} = @$elementOrder[$rows_n-1];
         } else {
           #inserted line below just to get it to run. it makes no sense to multiply by something which doesnt exist.
           $_row->{ELEMENT_ORDER} = $rows_n;
           $_row->{ELEMENT_ORDER} *= $scale;
           $_row->{ELEMENT_ORDER} += $offset;
         }
        
         push(@Rv, $_row);
      }

    } 

    # just add to list.
    else {

	if (exists $_row->{VALUE}) {
	    $_row->{VALUE}          = $Self->_treatValue($_row->{VALUE});
	}

      if (defined $elementOrder) {
        $_row->{ELEMENT_ORDER} = $elementOrder->[$_row->{ELEMENT_ORDER}];
      } else {
        #inserted line below just to get it to run. it makes no sense to multiply by something which doesnt exist.
        $_row->{ELEMENT_ORDER} = $rows_n;
        $_row->{ELEMENT_ORDER} *= $scale;
        $_row->{ELEMENT_ORDER} += $offset;
      }

      push(@Rv, $_row);
    }
  }
  $_sh->finish();

  if ($rows_n == 0) {
    die join("\t", ref $Self, 'no rows returned for query', $Self->getName(), $_sql);
  }

  return wantarray ? @Rv : \@Rv;
}

# -------------------------- getCollatedValues ---------------------------

=pod

=head1 Collect Values into a Table

Assumes that queries will have just these attributes:

ELEMENT_ORDER
COLUMN_NAME
VALUE or PROFILE_AS_STRING

Returns an array of arrays as follows:

ELEMENT_ORDER  COLUMN_NAME_1 COLUMN_NAME_2 ...
1              value    value    ...
...

When PROFILE_AS_STRING is appears, it assumes that the ELEMENT_ORDER
values should run from 1 unless they are specified in the
C<ElementOrder> attribute.

=cut

sub getCollatedValues {
	 my $Self = shift;
	 my $Qh   = shift;
	 my $Dict = shift;

	 my @Rv;

	 my %table;

	 # prepare dictionary
	 $Dict = $Self->prepareDictionary($Dict);

	 my $scale   = $Self->getScale()  || 1;
	 my $offset  = $Self->getOffset() || 0;

	 # execute SQL and get result
	 my $_sql = $Self->getExpandedSql($Dict);
	 my $_sh  = $Qh->prepare($_sql);
   $_sh->execute();
   my $rows_n = 0;
	 while (my $_row = $_sh->fetchrow_hashref()) {
      $rows_n++;
			my @keys = keys %$_row;

			# result contains a tab-delimited profile; split and pretend it
			# was separate rows.
			if (grep { $_ eq 'PROFILE_AS_STRING' } @keys) {
				 my @profile = split /\t/, $_row->{'PROFILE_AS_STRING'};
				 for (my $i = 0; $i < @profile; $i++) {
						$table{$_row->{COLUMN_NAME}}->[$i+1] = $Self->_treatValue($profile[$i]);
				 }
			}

			# just add to table
			else {
				 $table{$_row->{COLUMN_NAME}}->[$_row->{ELEMENT_ORDER}] = $Self->_treatValue($_row->{VALUE});
			}
	 }
	 $_sh->finish();

   if ($rows_n == 0) {
      die join("\t", ref $Self, 'no rows returned for query', $Self->getName(), $_sql);
   }

	 # re-format table to rows
	 # ........................................

	 my @columns = sort keys %table;
	 my $max_eo = CBIL::Util::V::max( map { scalar @{$table{$_}} } @columns) - 1;

	 for (my $i = 1; $i <= $max_eo; $i++) {
			push(@Rv, { ELEMENT_ORDER => $i * $scale + $offset,
									map { ( $_ => $table{$_}->[$i] ) } @columns
								}
					);
	 }

	 # done
	 # ........................................

	 return wantarray ? @Rv : \@Rv;
}

# ----------------------------- _treatValue ------------------------------

sub _treatValue {
   my $Self  = shift;
   my $Value = shift;

   my $Rv = $Value;

   if (my $scale = $Self->getScaleY()) {
      $Rv *= $scale;
   }

   $Rv = CBIL::Util::V::max($Rv, $Self->getFloor())   if defined $Self->getFloor();
   $Rv = CBIL::Util::V::min($Rv, $Self->getCeiling()) if defined $Self->getCeiling();

   return $Rv;
}

# ----------------------------- makeTabFile ------------------------------

sub makeTabFile {
	 my $Self = shift;
	 my $Qh   = shift;
	 my $Dict = shift || {};
	 my $File = shift;

   my $Rv;
	 my $tab_f = $File;
   if (not defined $tab_f) {

      my $tmp_p = $ENV{SCRATCH_PATH} || '/tmp';
      if ($Self->can('getId')) {
         $tab_f = sprintf("$tmp_p/%d-%s-%s.tab",
                          $$, $Self->getId(), $Self->getName()
                         );
      }
      else {
         $tab_f = sprintf("$tmp_p/%d-%s-%s.tab",
                          $$, 'all', $Self->getName()
                         );
      }
   }

         #print STDERR Dumper($Dict);
	 my @_rows = $Self->getValues($Qh, $Dict);
         die sprintf("No rows in query result '%s' for id  with sql as follows:\n%s",
               $Self->getName(),# $Self->getId(),
               $Self->getExpandedSql($Dict)
              ) unless scalar @_rows > 0;
	 my @keys    = sort keys %{$_rows[0]};

	 # prepare to write to file.
	 my $_fh = FileHandle->new(">$tab_f")
	 || die "Can not open tab file '$tab_f': $!";

	 # write header
	 print $_fh join("\t", @keys), "\n";

	 # write rows
	 foreach my $_row (@_rows) {
      next unless $_row;
			my @_row = map { defined $_row->{$_} ? $_row->{$_} : '' } @keys;
			print $_fh join("\t", @_row), "\n";
	 }

	 $_fh->close();

   $Rv = $tab_f;

	 return $Rv;
}

# ========================================================================
# ---------------------------- End of Package ----------------------------
# ========================================================================

1;

