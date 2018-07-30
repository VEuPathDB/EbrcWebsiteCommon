import { HistogramAnalysisPlugin, WordCloudAnalysisPlugin } from 'wdk-client/Plugins';

export default [
  {
    type: 'attributeAnalysis',
    name: 'wordCloud',
    plugin: WordCloudAnalysisPlugin
  },
  {
    type: 'attributeAnalysis',
    name: 'histogram',
    plugin: HistogramAnalysisPlugin
  }
]