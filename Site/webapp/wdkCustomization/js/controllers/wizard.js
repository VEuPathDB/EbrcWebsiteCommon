/* global wdk, ebrc */
import React from 'react';
import ReactDOM from 'react-dom';

import QuestionWizardController from '../client/controllers/QuestionWizardController';

wdk.namespace('ebrc.controllers', ns => {
  ns.wizard = function wizard($el) {
    const { wdkService } = ebrc.context;
    const questionName = $el.data('question-full-name');
    ReactDOM.render(
      React.createElement(QuestionWizardController, { wdkService, questionName }),
      $el[0]
    );
  }
});
