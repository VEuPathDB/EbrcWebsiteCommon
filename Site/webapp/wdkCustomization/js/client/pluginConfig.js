import { 
  HistogramAnalysisPlugin, 
  WordCloudAnalysisPlugin, 
  StepAnalysisViewPlugin,
  ResultTableSummaryViewPlugin, 
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
];
