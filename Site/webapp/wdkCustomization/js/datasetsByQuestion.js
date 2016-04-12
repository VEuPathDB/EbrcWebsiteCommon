/* global wdk, React, ReactDOM */
wdk.namespace('eupathdb', function(ns) {
  'use strict';

  var AnswerContainer = wdk.client.Components.AnswerContainer;

  /** bootstrap datasets table */
  function datasetsByQuestion($el, attrs) {
    var unmount = wdk.client.runtime.renderPartial(AnswerContainer, {
      recordClassName: 'dataset',
      questionName: 'DatasetsByQuestionName',
      parameters: {
        question_name: attrs.questionName
      }
    }, $el[0]);

    $el.closest('#query_form').on('wdk-query-form-removed', unmount);
  }

  ns.datasetsByQuestion = datasetsByQuestion;
});
