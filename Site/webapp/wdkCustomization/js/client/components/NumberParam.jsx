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
    let { min, max } = param;
    value = value * 1;

    return (
      <div className="number-param">
        <NumberSelector
          value={value}
          start={min}
          end={max}
          onChange={this.handleChange}
        />
      </div>
    )
  }
};
