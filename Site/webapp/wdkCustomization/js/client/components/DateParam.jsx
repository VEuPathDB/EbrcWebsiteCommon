import React from 'react';
import { DateSelector } from 'wdk-client/Components';
import { paramPropTypes } from './QuestionWizard';

/**
 * NumberRangeParam component
 */
export default class DateParam extends React.PureComponent {
  constructor (props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    console.log("date param props", props);
  }

  handleChange (newValue) {
    let { param, onParamValueChange } = this.props;
    onParamValueChange(param, newValue);
  }

  render () {
    let { param, value } = this.props;

    return (
      <DateSelector
        value={value}
        onChange={this.handleChange}
      />
    );
  }
}

DateParam.propTypes = paramPropTypes;
