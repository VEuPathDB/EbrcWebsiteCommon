import { 
  HistogramAnalysisPlugin, 
  WordCloudAnalysisPlugin, 
  StepAnalysisViewPlugin,
  ResultTableSummaryViewPlugin, 
  GenomeSummaryViewPlugin,
  BlastSummaryViewPlugin,
  MatchedTranscriptsFilterPlugin,
} from 'wdk-client/Plugins';

export default [
  {
    type: 'attributeAnalysis',
    name: 'wordCloud',
    component: WordCloudAnalysisPlugin
  },
  {
    type: 'attributeAnalysis',
    name: 'histogram',
    component: HistogramAnalysisPlugin
  },
  {
    type: 'stepAnalysis',
    name: 'stepAnalysis',
    component: StepAnalysisViewPlugin
  },
  {
    type: 'summaryView',
    name: '_default',
    component: ResultTableSummaryViewPlugin
  },
  {
    type: 'summaryView',
    name: 'genomic-view',
    component: GenomeSummaryViewPlugin
  },
  {
    type: 'summaryView',
    name: 'blast-view',
    component: BlastSummaryViewPlugin
  },
  {
    type: 'summaryView',
    name: 'popset-view',
    component: () => <div>TODO</div>
  },
  {
    type: 'questionFilter',
    name: 'matched_transcript_filter_array',
    component: MatchedTranscriptsFilterPlugin
  }
];
