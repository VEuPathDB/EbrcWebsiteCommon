import React from 'react';
import { HelpIcon } from 'wdk-client/Components';
import { wrappable } from 'wdk-client/Utils/ComponentUtils';
import { makeQuestionWizardClassName as makeClassName } from '../util/classNames';
import { WizardState, ParameterEventHandlers } from '../util/WizardTypes';
import {
  Parameter,
  ParameterGroup,
  // ParamUIState,
  QuestionWithParameters,
  RecordClass,
  ParameterValues,
  ParameterValue
} from 'wdk-client/Utils/WdkModel';
import { Plugin } from 'wdk-client/Utils/ClientPlugin';
import { Dispatch } from 'redux';

type Props = {
  //group: ActiveGroup was needed by previous param
  searchName: string,
  recordClassName: string,
  parameters: Parameter[],
  paramValues: ParameterValues,
  paramUIState: WizardState['paramUIState'],
  eventHandlers: ParameterEventHandlers,
  dispatch: Dispatch
}

function Parameters(props: Props) {

  const {paramValues, paramUIState, eventHandlers, searchName, recordClassName, dispatch} = props;
  const showLabel = props.parameters.length > 1;
  return (
    <div className={makeClassName('ParamContainer')}>
      {props.parameters.map(parameter => {
        return (
          <div key={parameter.name} className={makeClassName('Param', parameter.type)}>
            {showLabel && (
              <div className={makeClassName('ParamLabel', parameter.type)}>
                <label>{parameter.displayName}</label>
              </div>
            )}
            {showLabel && (
              <div className={makeClassName('ParamHelp', parameter.type)}>
                <HelpIcon>
                  {parameter.help}
                </HelpIcon>
              </div>
            )}
            <div
              className={makeClassName('ParamControl', parameter.type)}
              onKeyPress={event => {
                // Prevent form submission of ENTER is pressed while an input
                // field has focus. This is a hack and may bite us in the future
                // if we have param widgets that depend on the user agent's
                // default handling of the event.
                //
                // FIXME Handle this in a more robust manner.
                // The reason we do it this way is that the question wizard is
                // embedded inside of the classic WDK question form, which may
                // or may not use an inline submit handler, depending on the
                // context. The question wizard needs more control over the form
                // element in order to do the following in a more robust manner.
                if (event.target instanceof HTMLInputElement && event.key === 'Enter') {
                  event.preventDefault();
                }
              }}
            >
            <Plugin
              context={{
                type: 'questionFormParameter',
                name: parameter.name,
                searchName,
                recordClassName
              }}
              pluginProps={{
                ctx: {
                  searchName,
                  parameter,
                  paramValues: paramValues
                },
                parameter: parameter,
                value: paramValues[parameter.name],
                uiConfig: {hideGlobalCounts: true},
                uiState: paramUIState[parameter.name],
                onParamValueChange: (paramValue: string) => {
                  eventHandlers.onParamValueChange(
                    parameter,
                    paramValue
                  )
                },
                dispatch: dispatch
              }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default wrappable(Parameters);
