/* global wdk, ebrc */
import React from 'react';
import ReactDOM from 'react-dom';
import { Dispatcher } from 'flux';
import { ReduceStore } from 'flux/utils';
import QuestionWizardController from '../client/controllers/QuestionWizardController';

wdk.namespace('ebrc.controllers', ns => {
  ns.wizard = function wizard($el) {
    const { wdkService } = ebrc.context;
    const questionName = $el.data('question-full-name');
    const customName = $el.data('custom-name');
    const showHelpText = $el.data('show-help-text');
    const paramValuesContainerSelector = $el.data('param-values-container-selector');
    const paramValues = parseJson($el.find(paramValuesContainerSelector).val().trim());
    const store = new QuestionWizardStore(new Dispatcher);
    ReactDOM.render(
      React.createElement(QuestionWizardController, {
        store,
        wdkService,
        questionName,
        paramValues,
        customName,
        showHelpText
      }),
      $el[0]
    );
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

const INIT_STATE = 'init_state';

class QuestionWizardStore extends ReduceStore {

  getInitialState() {
    return {};
  }

  reduce(state, action) {
    switch(action.type) {
      case INIT_STATE: return action.payload;
      default: return state;
    }
  }

}
