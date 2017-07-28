import React from 'react';
import { paramPropTypes } from './QuestionWizard';
import { NumberSelector } from 'wdk-client/Components';

export default class NumberParam extends React.PureComponent {
  constructor (props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange (newValue) {
    let { param, onParamValueChange } = this.props;
    newValue = newValue * 1;
    onParamValueChange(param, newValue);
  }

  render () {
    let { param, value } = this.props;
    let { min, max, integer, step } = param;
    value = value * 1;

    if (step) step = step * 1;
    else step = (!integer || integer === 'false' ? 0.01 : 1);

    return (
      <div className="number-param">
        <NumberSelector
          value={value}
          start={min}
          end={max}
          step={step}
          onChange={this.handleChange}
        />
      </div>
    )
  }
};
