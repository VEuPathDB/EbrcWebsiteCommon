import React from 'react';
import { paramPropTypes } from './QuestionWizard';
import { DateRangeSelector } from 'wdk-client/Components';

/**
 * DateRange param
*/
export default class DateRangeParam extends React.PureComponent {
  constructor (props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    console.log("dateRange param props", props);

    this.state = { initialRange: JSON.parse(props.value) };
  }

  handleChange (newValue) {
    let { param, onParamValueChange } = this.props;
    onParamValueChange(param, JSON.stringify(newValue));
  }

  render () {
    let { param, value, uiState } = this.props;
    let { initialRange } = this.state;
    value = JSON.parse(value);

    return (
      <div className="date-range-param">
        <DateRangeSelector
          value={value}
          start={initialRange.min}
          end={initialRange.max}
          onChange={this.handleChange}
        />
      </div>
    );
  }
}

DateRangeParam.propTypes = paramPropTypes;
