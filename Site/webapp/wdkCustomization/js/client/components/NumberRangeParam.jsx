import React from 'react';
import { paramPropTypes } from './QuestionWizard';
import { NumberRangeSelector } from 'wdk-client/Components';

/**
 * NumberRangeParam component
 */
 export default class NumberRangeParam extends React.PureComponent {

   constructor (props) {
     super(props);
     this.handleChange = this.handleChange.bind(this);
   }

   handleChange (newValue) {
     let { param, onParamValueChange } = this.props;
     newValue = JSON.stringify(newValue);
     onParamValueChange(param, newValue);
   }

   render () {
     let { param, value } = this.props;
     let { min, max, integer, step } = param;
     value = JSON.parse(value);
     if (typeof value.min === 'string') value.min = value.min * 1;
     if (typeof value.max === 'string') value.max = value.max * 1;

     if (step) step = step * 1;
     else step = (!integer || integer === 'false' ? 0.01 : 1);

     return (
       <div className="number-range-param">
         <NumberRangeSelector
           value={value}
           start={min}
           end={max}
           step={step}
           onChange={this.handleChange}
         />
       </div>
     );
   }
 }

NumberRangeParam.propTypes = paramPropTypes;
