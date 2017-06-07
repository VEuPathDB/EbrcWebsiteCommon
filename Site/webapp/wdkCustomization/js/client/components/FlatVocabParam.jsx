import React from 'react';
import { paramPropTypes } from './QuestionWizard';

/**
 * FlatVocabParam component. Currently only supports single select.
 * FIXME Handle all param options.
 */
export default function FlatVocabParam(props) {
  return (
    <select
      onChange={event => props.onParamValueChange(props.param, event.value)}
      value={props.value}
      multiple={props.param.multiPick}
    >
      {props.param.vocabulary.map(entry => (
        <option value={entry[0]}>{entry[1]}</option>
      ))}
    </select>
  )
}

FlatVocabParam.propTypes = paramPropTypes;
