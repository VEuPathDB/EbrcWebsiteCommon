/* global wdk, ebrc */
import React from 'react';
import ReactDOM from 'react-dom';

import QuestionWizardController from '../client/controllers/QuestionWizardController';

wdk.namespace('ebrc.controllers', ns => {
  ns.wizard = function wizard($el) {
    const { wdkService } = ebrc.context;
    const questionFullName = $el.data('question-full-name');

    const question$ = wdkService.sendRequest({
      method: 'GET',
      path: '/question/' + questionFullName,
      params: { expandParams: true },
    });

    const recordClass$ = question$.then(question => {
      return wdkService.findRecordClass(rc => rc.name === question.recordClassName);
    });

    Promise.all([ question$, recordClass$ ])
    .then(
      ([ question, recordClass ]) => {
        document.title = `Search for ${recordClass.displayName} by ${question.displayName}`;
        ReactDOM.render(React.createElement(QuestionWizardController, { question }), $el[0]);
      },
      error => {
        $el.html(`<p style="color: red">The search page could not be loaded.</p>`);
        console.error(error);
      }
    );
  }
});
