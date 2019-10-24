import { 
  HistogramAnalysisPlugin, 
  WordCloudAnalysisPlugin, 
  StepAnalysisViewPlugin,
  ResultTableSummaryViewPlugin, 
  StepAnalysisDefaultForm,
  StepAnalysisDefaultResult,
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
    type: 'stepAnalysisView',
    name: 'defaultStepAnalysisView',
    component: StepAnalysisViewPlugin
  },
  {
    type: 'summaryView',
    name: '_default',
    component: ResultTableSummaryViewPlugin
  },
  {
    type: 'stepAnalysisForm',
    component: StepAnalysisDefaultForm
  },
  {
    type: 'stepAnalysisResult',
    component: StepAnalysisDefaultResult
  },
];
