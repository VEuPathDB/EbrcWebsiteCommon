import React from 'react';
import { paramPropTypes } from './QuestionWizard';

/**
 * StringParam component
 */
export default function StringParam(props) {
  const { param, value, onParamValueChange, autoFocus } = props;
  return (
    <input
      type="text"
      value={value}
      onChange={e => onParamValueChange(param, e.target.value)}
      autoFocus={autoFocus}
    />
  );
}

StringParam.propTypes = paramPropTypes;
