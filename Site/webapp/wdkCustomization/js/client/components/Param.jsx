import React from 'react';
import PropTypes from 'prop-types';
import FilterParamNew from './FilterParamNew';
import FlatVocabParam from './FlatVocabParam';
import StringParam from './StringParam';
import DateParam from './DateParam';
import DateRangeParam from './DateRangeParam';
import NumberParam from './NumberParam';
import NumberRangeParam from './NumberRangeParam'
import { wrappable } from 'wdk-client/ComponentUtils';

/**
 * Param component
 */
function Param(props) {
  const ParamComponent = props.findParamComponent(props.param);
  if (ParamComponent == null) {
    return (
      <div>
        {props.param.displayName} {props.param.defaultValue}
      </div>
    )
  }
  return <ParamComponent {...props}/>
}

Param.propTypes = {
  param: PropTypes.object.isRequired,
  value: PropTypes.string.isRequired,
  uiState: PropTypes.object.isRequired,
  onActiveOntologyTermChange: PropTypes.func.isRequired,
  onParamValueChange: PropTypes.func.isRequired,
  autoFocus: PropTypes.bool,
  findParamComponent: PropTypes.func
}

Param.defaultProps = {
  findParamComponent
};

/**
 * Lookup Param component by param type
 */
function findParamComponent(param) {
  switch(param.type) {
    case 'FilterParamNew': return FilterParamNew;
    case 'StringParam': return StringParam;
    case 'EnumParam': return FlatVocabParam;
    case 'FlatVocabParam': return FlatVocabParam;
    case 'DateParam': return DateParam;
    case 'DateRangeParam': return DateRangeParam;
    case 'NumberParam': return NumberParam;
    case 'NumberRangeParam': return NumberRangeParam;
    default: return null;
  }
}

export default wrappable(Param);
