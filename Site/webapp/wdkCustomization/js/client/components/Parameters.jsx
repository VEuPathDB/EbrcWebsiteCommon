import React from 'react';
import PropTypes from 'prop-types';
import { Icon, Tooltip } from 'wdk-client/Components';
import { wrappable } from 'wdk-client/ComponentUtils';
import Param from './Param';
import { makeQuestionWizardClassName as makeClassName } from '../util/classNames';

/**
 * Parameters that belong to a Paramter group
 */
function Parameters(props) {
  const { parameters, paramValues, paramUIState, onActiveOntologyTermChange, onParamValueChange } = props;
  const showLabel = parameters.length > 1;
  return (
    <div className={makeClassName('ParamContainer')}>
      {parameters.map(param => {
        return (
          <div key={param.name} className={makeClassName('Param', param.type)}>
            {showLabel && (
              <div className={makeClassName('ParamLabel', param.type)}>
                <label>{param.displayName}</label>
              </div>
            )}
            {showLabel && (
              <div className={makeClassName('ParamHelp', param.type)}>
                <Tooltip content={param.help}>
                  <Icon type="help"/>
                </Tooltip>
              </div>
            )}
            <div
              className={makeClassName('ParamControl', param.type)}
              onKeyPress={event => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                }
              }}
            >
              <Param
                param={param}
                value={paramValues[param.name]}
                uiState={paramUIState[param.name]}
                onActiveOntologyTermChange={onActiveOntologyTermChange}
                onParamValueChange={onParamValueChange}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

Parameters.propTypes = {
  group: PropTypes.object.isRequired,
  parameters: PropTypes.array.isRequired,
  paramValues: PropTypes.object.isRequired,
  paramUIState: PropTypes.object.isRequired,
  onActiveOntologyTermChange: PropTypes.func.isRequired,
  onParamValueChange: PropTypes.func.isRequired
}

export default wrappable(Parameters);
