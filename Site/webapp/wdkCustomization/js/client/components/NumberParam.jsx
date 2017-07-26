import React from 'react';
import { NumberSelector } from 'wdk-client/Components';
import { paramPropTypes } from './QuestionWizard';

export default class Numberparam extends React.PureComponent {
  constructor (props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange (newValue) {
    let { param, onParamValueChange } = this.props;
    onParamValueChange(param, newValue);
  }

  render () {
    let { param, value } = this.props;
    let { minValue, maxValue } = param;
    value = JSON.parse(value);

    return (
      <div className="number-param">
        <NumberSelector
          value={value}
          start={minValue}
          end={maxValue}
          onChange={this.handleChange}
        />
      </div>
    )
  }
}
