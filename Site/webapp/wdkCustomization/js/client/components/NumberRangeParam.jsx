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
     newValue = JSON.stringify(newValue).replace(/\"/g, "'");
     onParamValueChange(param, newValue);
   }

   render () {
     let { param, value } = this.props;
     let { min, max } = param;
     value = JSON.parse(value.replace(/'/g, "\""))

     return (
       <div className="number-range-param">
         <NumberRangeSelector
           value={value}
           start={min}
           end={max}
           onChange={this.handleChange}
         />
       </div>
     );
   }
 }

NumberRangeParam.propTypes = paramPropTypes;
