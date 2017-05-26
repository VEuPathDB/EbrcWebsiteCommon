import React from 'react';
import QuestionWizard from '../components/QuestionWizard';

export default class QuestionWizardController extends React.Component {

  constructor(props) {
    super(props);
    this.state = { };
    this.onActiveGroupChange = this.onActiveGroupChange.bind(this);
    this.onActiveOntologyTermChange = this.onActiveOntologyTermChange.bind(this);
    this.onParamValueChange = this.onParamValueChange.bind(this);
  }

  loadQuestion(props) {
    const { questionName, wdkService } = props;
    const question$ = wdkService.sendRequest({
      method: 'GET',
      path: '/question/' + questionName,
      params: { expandParams: true }
    });

    const recordClass$ = question$.then(question => {
      return wdkService.findRecordClass(rc => rc.name === question.recordClassName);
    });

    Promise.all([ question$, recordClass$ ])
    .then(
      ([ question, recordClass ]) => {
        document.title = `Search for ${recordClass.displayName} by ${question.displayName}`;

        const paramValues = question.parameters.reduce(function(paramValues, param) {
          return Object.assign(paramValues, {
            [param.name]: param.defaultValue
          });
        }, {});

        const paramUIState = question.parameters.reduce(function(uiState, param) {
          switch(param.type) {
            case 'FilterParamNew':
              return Object.assign(uiState, {
                [param.name]: {
                  activeOntologyTerm: undefined,
                  ontologyTermSummaries: {}
                }
              });

            default:
              return Object.assign(uiState, {
                [param.name]: {}
              });
          }
        }, {});

        this.setState({
          question,
          paramValues,
          paramUIState,
          recordClass,
          activeGroup: undefined
        });

        question.parameters.forEach(param => {
          if (param.type === 'FilterParamNew') {
            this.props.wdkService.getFilterParamSummaryCounts(
              question.urlSegment,
              param.name,
              JSON.parse(paramValues[param.name]).filters || [],
              paramValues
            ).then(counts => {
              this._updateParamUIState(param.name, { counts });
            })
          }
        });

      },
      error => {
        this.setState({ error });
      }
    );
  }

  onActiveGroupChange(activeGroup) {
    this.setState({ activeGroup });
  }

  onActiveOntologyTermChange(param, filters, ontologyTerm) {
    this._updateParamUIState(param.name, {
      activeOntologyTerm: ontologyTerm
    });
    this.props.wdkService.getOntologyTermSummary(
      this.state.question.urlSegment,
      param.name,
      filters.filter(filter => filter.field !== ontologyTerm),
      ontologyTerm,
      this.state.paramValues
    ).then(ontologyTermSummary => {
      const { ontologyTermSummaries } = this.state.paramUIState[param.name];
      this._updateParamUIState(param.name, {
        ontologyTermSummaries: Object.assign({}, ontologyTermSummaries, {
          [ontologyTerm]: formatSummary(ontologyTermSummary)
        })
      });
    });
  }

  onParamValueChange(param, paramValue) {
    this.setState({
      paramValues: Object.assign({}, this.state.paramValues, {
        [param.name]: paramValue
      })
    });

    if (param.type === 'FilterParamNew') {

      const { filters = [] } = JSON.parse(paramValue);
      const { activeOntologyTerm } = this.state.paramUIState[param.name];

      this.props.wdkService.getFilterParamSummaryCounts(
        this.state.question.urlSegment,
        param.name,
        filters,
        this.state.paramValues
      ).then(counts => {
        this._updateParamUIState(param.name, { counts });
      });

      this.props.wdkService.getOntologyTermSummary(
        this.state.question.urlSegment,
        param.name,
        filters.filter(filter => filter.field !== activeOntologyTerm),
        activeOntologyTerm,
        this.state.paramValues
      ).then(ontologyTermSummary => {
        const { ontologyTermSummaries } = this.state.paramUIState[param.name];
        this._updateParamUIState(param.name, {
          ontologyTermSummaries: Object.assign({}, ontologyTermSummaries, {
            [activeOntologyTerm]: formatSummary(ontologyTermSummary)
          })
        });
      });

    }
    // this.props.wdkService.getQuestionParamValues(
    //   this.state.question.urlSegment,
    //   paramName,
    //   paramValue,
    //   this.state.paramValues
    // ).then(question => {
    // TODO I think we need to update both paramValues and paramUIState with `question.parameters` - dmf
    // })
  }

  _updateParamUIState(paramName, newState) {
    this.setState({
      paramUIState: Object.assign({}, this.state.paramUIState, {
        [paramName]: Object.assign({}, this.state.paramUIState[paramName], newState)
      })
    });
  }

  componentDidMount() {
    this.loadQuestion(this.props);
  }

  componentDidWillReceiveProps(nextProps) {
    this.loadQuestion(nextProps);
  }

  render() {
    if (this.state.question == null) return null;

    return (
      <QuestionWizard 
        question={this.state.question}
        recordClass={this.state.recordClass}
        activeGroup={this.state.activeGroup}
        paramValues={this.state.paramValues}
        paramUIState={this.state.paramUIState}
        onActiveGroupChange={this.onActiveGroupChange}
        onActiveOntologyTermChange={this.onActiveOntologyTermChange}
        onParamValueChange={this.onParamValueChange}
      />
    )
  }

}

function formatSummary(summary) {
  return Object.keys(summary).map(value => ({
    value,
    count: summary[value].unfiltered,
    filteredCount: summary[value].filtered
  }));
}
