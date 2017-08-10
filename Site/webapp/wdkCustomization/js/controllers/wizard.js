/* global wdk, ebrc */
import React from 'react';
import ReactDOM from 'react-dom';
import QuestionWizardController from '../client/controllers/QuestionWizardController';

wdk.namespace('ebrc.controllers', ns => {
  ns.wizard = function wizard($el) {
    const { wdkService } = ebrc.context;
    const questionName = $el.data('question-full-name');
    const customName = $el.data('custom-name');
    const showHelpText = $el.data('show-help-text');
    const isAddingStep = $el.data('is-adding-step');
    const paramValuesContainerSelector = $el.data('param-values-container-selector');
    const paramValues = parseJson($el.find(paramValuesContainerSelector).val().trim());
    ReactDOM.render(
      React.createElement(QuestionWizardController, {
        wdkService,
        questionName,
        paramValues,
        customName,
        showHelpText,
        isAddingStep
      }),
      $el[0]
    );
    handleEvents($el);
  }
});

function parseJson(string) {
  try {
    return JSON.parse(string);
  }
  catch(error) {
    console.warn('Unable to parse JSON', error);
    return {};
  }
}

function handleEvents($el) {
  const $form = $el.closest('form');
  $form
    .on('submit', () => {
      $form.block()
    })
    .on(wdk.addStepPopup.SUBMIT_EVENT, () => {
      $form.block()
    })
    .on(wdk.addStepPopup.CANCEL_EVENT, () => {
      $form.unblock()
    })
    .on(wdk.addStepPopup.FORM_DESTROY_EVENT, () => {
      ReactDOM.unmountComponentAtNode($el[0]);
    });
}
