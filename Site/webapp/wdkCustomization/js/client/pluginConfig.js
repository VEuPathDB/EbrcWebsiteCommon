import { 
  HistogramAnalysisPlugin, 
  WordCloudAnalysisPlugin, 
  StepAnalysisViewPlugin,
  ResultTableSummaryViewPlugin, 
  StepAnalysisDefaultForm,
  StepAnalysisDefaultResult,
  StepAnalysisEupathExternalResult,
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
    name: 'otu_abundance',
    component: StepAnalysisEupathExternalResult
  },
  {
    type: 'stepAnalysisResult',
    name: 'alpha_diversity',
    component: StepAnalysisEupathExternalResult
  },
  {
    type: 'stepAnalysisResult',
    name: 'beta_diversity',
    component: StepAnalysisEupathExternalResult
  },
  {
    type: 'stepAnalysisResult',
    name: 'differential_abundance',
    component: StepAnalysisEupathExternalResult
  },
  {
    type: 'stepAnalysisResult',
    name: 'correlation_app',
    component: StepAnalysisEupathExternalResult
  },
  {
    type: 'stepAnalysisResult',
    name: 'person-graph-analysis',
    component: StepAnalysisEupathExternalResult
  },
  {
    type: 'stepAnalysisResult',
    name: 'light-trap-plots',
    component: StepAnalysisEupathExternalResult
  },
  {
    type: 'stepAnalysisResult',
    name: 'clinepi-cont-table',
    component: StepAnalysisEupathExternalResult
  },
  {
    type: 'stepAnalysisResult',
    name: 'clinepi-event-dist',
    component: StepAnalysisEupathExternalResult
  },
  {
    type: 'stepAnalysisResult',
    name: 'clinepi-summaries',
    component: StepAnalysisEupathExternalResult
  },
  {
    type: 'stepAnalysisResult',
    component: StepAnalysisDefaultResult
  },
];
