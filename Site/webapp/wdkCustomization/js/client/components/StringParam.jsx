import React from 'react';
import { paramPropTypes } from './QuestionWizard';

/**
 * StringParam component
 */
export default function StringParam(props) {
  const { param, value, onParamValueChange } = props;
  return (
    <input type="text" value={value} onChange={e => onParamValueChange(param, e.target.value)} />
  );
}

StringParam.propTypes = paramPropTypes;
