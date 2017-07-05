import React from 'react';
import { paramPropTypes } from './QuestionWizard';

/**
 * FlatVocabParam component. Currently only supports single select.
 * FIXME Handle all param options.
 */
export default function FlatVocabParam(props) {
  return (
    <select
      onChange={event => props.onParamValueChange(props.param, event.target.value)}
      value={props.value}
      multiple={props.param.multiPick}
    >
      {props.uiState.vocabulary.map(entry => (
        <option value={entry[0]}>{entry[1]}</option>
      ))}
    </select>
  )
}

FlatVocabParam.propTypes = paramPropTypes;
