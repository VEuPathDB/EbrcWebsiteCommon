import React from 'react';
import QuestionWizard from '../components/QuestionWizard';

export default class QuestionWizardController extends React.Component {

  constructor(props) {
    super(props);
    this.handleWizardChange = wizardState => this.setState({ wizardState });
    this.state = {
      wizardState: QuestionWizard.createEmptyState()
    };
  }


  render() {
    return (
      <QuestionWizard 
        question={this.props.question}
        paramHandlers={this.paramHandlers}
        wizardState={this.state.wizardState}
        onChange={this.handleWizardChange}
      />
    )
  }

}
