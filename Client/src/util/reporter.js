import { STANDARD_REPORTER_NAME } from '@veupathdb/wdk-client/lib/Views/ReporterForm/reporterUtils';
import WdkServiceJsonReporterForm from '@veupathdb/wdk-client/lib/Views/ReporterForm/WdkServiceJsonReporterForm';

// load individual reporter forms
import TabularReporterForm from '../components/reporters/TabularReporterForm';
import TextReporterForm from '../components/reporters/TextReporterForm';
import XmlReporterForm from '../components/reporters/XmlReporterForm';
import JsonReporterForm from '../components/reporters/JsonReporterForm';
import Gff3ReporterForm from '../components/reporters/Gff3ReporterForm';
import FastaGeneReporterForm from '../components/reporters/FastaGeneReporterForm';
import BedGeneReporterForm from '../components/reporters/BedGeneReporterForm';
import BedDynSpanReporterForm from '../components/reporters/BedDynSpanReporterForm';
import BedGenomicSequenceReporterForm from '../components/reporters/BedGenomicSequenceReporterForm';
import BedSequenceReporterForm from '../components/reporters/BedSequenceReporterForm';
import FastaGenomicSequenceReporterForm from '../components/reporters/FastaGenomicSequenceReporterForm';
import FastaOrthoSequenceReporterForm from '../components/reporters/FastaOrthoSequenceReporterForm';
import TableReporterForm from '../components/reporters/TableReporterForm';
import TranscriptTableReporterForm from '../components/reporters/TranscriptTableReporterForm';
import TranscriptAttributesReporterForm from '../components/reporters/TranscriptAttributesReporterForm';

let EmptyReporter = props => ( null );

EmptyReporter.getInitialState = () => ({ formState: null, formUiState: null });

export function selectReporterComponent(reporterName, recordClassFullName) {
  switch (reporterName) {
    case 'attributesTabular':
      switch (recordClassFullName) {
        case 'TranscriptRecordClasses.TranscriptRecordClass':
          return TranscriptAttributesReporterForm;
        default:
          return TabularReporterForm;
      }
    case 'tableTabular':
      switch (recordClassFullName) {
        case 'TranscriptRecordClasses.TranscriptRecordClass':
          return TranscriptTableReporterForm;
        default:
          return TableReporterForm;
      }
    case 'tabular':
      return TabularReporterForm;
    case 'srt':
      switch (recordClassFullName) {
        // both gene and transcript use the same reporter
        case 'GeneRecordClasses.GeneRecordClass':
        case 'TranscriptRecordClasses.TranscriptRecordClass':
          return FastaGeneReporterForm;
        case 'SequenceRecordClasses.SequenceRecordClass':
          return FastaGenomicSequenceReporterForm;
        default:
          console.error("Unsupported FASTA recordClass: " + recordClassFullName);
          return EmptyReporter;
      }
    case 'bed':
    case 'sequence':
      switch (recordClassFullName) {
        // both gene and transcript use the same reporter
        case 'GeneRecordClasses.GeneRecordClass':
        case 'TranscriptRecordClasses.TranscriptRecordClass':
          return BedGeneReporterForm;
        case 'SequenceRecordClasses.SequenceRecordClass':
          return BedGenomicSequenceReporterForm;
        case 'DynSpanRecordClasses.DynSpanRecordClass':
          return BedDynSpanReporterForm;
        case 'PopsetRecordClasses.PopsetRecordClass':
        case 'EstRecordClasses.EstRecordClass':
          return BedSequenceReporterForm;
        default:
          console.error("Unsupported BED recordClass: " + recordClassFullName);
          return EmptyReporter;
      }
    case 'fasta':
      return FastaOrthoSequenceReporterForm;
    case 'gff3':
      return Gff3ReporterForm;
    case 'fullRecord':
      return TextReporterForm;
    case 'xml':
      return XmlReporterForm;
    case 'json':
      return JsonReporterForm;
    case STANDARD_REPORTER_NAME:
      return WdkServiceJsonReporterForm;
    default:
      return EmptyReporter;
  }
}
