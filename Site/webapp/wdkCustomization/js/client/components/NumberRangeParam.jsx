import React from 'react';
import { paramPropTypes } from './QuestionWizard';
import { NumerRangeSelector } from 'wdk-client/Components';

/**
 * NumberRangeParam component
 */
 export default class NumberRangeParam extends React.PureComponent {

   constructor (props) {
     super(props);
     this.handleChange = this.handleChange.bind(this);
   }

   handleChange (newValue) {
     const { onParamValueChange, param } = this.props;
     onParamValueChange(param, JSON.stringify(newValue));
   }

   render () {
     let { value } = this.props;
     return (
       <NumberRangeSelector
          value={value}
          onChange={this.handleChange}
       />
     );
   }
 }

NumberRangeParam.propTypes = paramPropTypes;
