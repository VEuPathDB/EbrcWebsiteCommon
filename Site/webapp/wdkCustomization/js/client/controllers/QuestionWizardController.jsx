import React from 'react';
import QuestionWizard from '../components/QuestionWizard';
import { Seq } from 'wdk-client/IterableUtils';
import { groupBy, isEqual } from 'lodash';

/**
 * Controller for question wizard
 *
 * FIXME Move state management into a Store. As-is, there are potential race
 * conditions due to `setState()` being async.
 */
export default class QuestionWizardController extends React.Component {

  constructor(props) {
    super(props);
    this.state = { };
    this.onActiveGroupChange = this.onActiveGroupChange.bind(this);
    this.onActiveOntologyTermChange = this.onActiveOntologyTermChange.bind(this);
    this.onParamValueChange = this.onParamValueChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
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

        const groupUIState = question.groups.reduce(function(groupUIState, group) {
          return Object.assign(groupUIState, {
            [group.name]: { accumulatedTotal: undefined }
          });
        }, {});

        this.setState({
          question,
          paramValues,
          paramUIState,
          groupUIState,
          recordClass,
          activeGroup: undefined
        });

        question.parameters.forEach(param => {
          if (param.type === 'FilterParamNew') {
            this._updateFilterParamCounts(param.name,
              JSON.parse(paramValues[param.name]).filters || []);
          }
        });

        this.props.wdkService.getAnswer({
          questionName: question.name,
          parameters: paramValues
        }).then(answer => {
          this.setState({
            totalCount: answer.meta.totalCount
          });
        });

      },
      error => {
        this.setState({ error });
      }
    );
  }

  onActiveGroupChange(activeGroup) {
    this.setState({ activeGroup });
    // TODO Only update counts for groups that don't have counts
    const groups = Seq.from(this.state.question.groups)
      .takeWhile(group => group != activeGroup)
      .concat(Seq.of(activeGroup))
      .filter(group => this.state.groupUIState[group.name].accumulatedTotal == null);
    this._updateGroupCounts(groups);
  }

  onActiveOntologyTermChange(param, filters, ontologyTerm) {
    this._updateParamUIState(param.name, {
      activeOntologyTerm: ontologyTerm
    });
    if (this.state.paramUIState[param.name].ontologyTermSummaries[ontologyTerm] == null) {
      this._updateOntologyTermSummary(param.name, ontologyTerm, filters);
    }
  }

  onParamValueChange(param, paramValue) {
    const groups = Seq.from(this.state.question.groups);
    const currentGroup = groups.find(group => group.parameters.includes(param.name));
    const groupsToUpdate = groups
      .dropWhile(group => group !== currentGroup)
      .takeWhile(group => this.state.groupUIState[group.name].accumulatedTotal != null);
    this.setState({
      paramValues: Object.assign({}, this.state.paramValues, {
        [param.name]: paramValue
      })
    }, () => {
      this._updateGroupCounts(groupsToUpdate);
      this._handleParamValueChange(param, paramValue);
      this._updateDependedParams(param, paramValue);
    })
  }

  onSubmit() {
    const paramFormElements = this.state.question.parameters.map(param => ({
      name: `value(${param.name})`,
      value: this.state.paramValues[param.name]
    }));

    // submit question form
    createForm({
      action: 'processQuestion.do',
      method: 'post',
      elements: [
        { name: 'questionFullName', value: this.state.question.name },
        { name: 'wizard', value: true },
        { name: 'questionSubmit', value: 'Get Answer' },
        ...paramFormElements
      ]
    }).submit();
  }

  _handleParamValueChange(param, paramValue) {
    if (param.type === 'FilterParamNew') {
      const { filters = [] } = JSON.parse(paramValue);
      const { filters: oldFilters = [] } = JSON.parse(this.state.paramValues[param.name]);
      const { activeOntologyTerm, ontologyTermSummaries } = this.state.paramUIState[param.name];

      // Get an array of fields whose associated filters have been modified.
      const modifiedFields = Object.entries(groupBy(filters.concat(oldFilters), 'field'))
        .filter(([, filters]) => filters.length === 1 || !isEqual(filters[0], filters[1]))
        .map(([ field ]) => field);

      const singleModifiedField = modifiedFields.length === 1 ? modifiedFields[0] : null;

      const shouldUpdateActiveOntologyTermSummary = singleModifiedField !== activeOntologyTerm;

      // Ontology term summaries we want to keep. We definitely want to keep the
      // active ontology summary to prevent an empty panel while it's loading.
      // Also, in the case that only a single filter has been modified, we don't
      // need to update the associated ontologyTermSummary.
      const newOntologyTermSummaries = Object.assign({
        [activeOntologyTerm]: ontologyTermSummaries[activeOntologyTerm]
      }, singleModifiedField && {
        [singleModifiedField]: ontologyTermSummaries[singleModifiedField]
      });

      this._updateParamUIState(param.name, {
        ontologyTermSummaries: newOntologyTermSummaries
      });

      this._updateFilterParamCounts(param.name, filters);

      // This only needs to be called if the modified filter value is not for
      // the active ontology term.
      if (shouldUpdateActiveOntologyTermSummary) {
        this._updateOntologyTermSummary(param.name, activeOntologyTerm, filters);
      }
    }
  }

  _updateDependedParams(param, paramValue) {
    this.props.wdkService.getQuestionParamValues(
      this.state.question.urlSegment,
      param.name,
      paramValue,
      this.state.paramValues
    ).then(question => {
      // for each parameter, reinitialize param state and value
      // these are params with a vocab, so we have to check if current value is compatible
      // if not, then reset value to default
      const paramValues = question.parameters.reduce((paramValues, param) => {
        if (param.type === 'FilterParamNew') {
          const { filters = [] } = JSON.parse(this.state.paramValues[param.name]);
          // TODO update param value with invalid filters removed
          const newFilters = filters.filter(filter => filter.field in param.ontology);
          if (filters.length !== newFilters.length) {
            console.log('Invalid filters detected', { filters, newFilters });
          }
          this._updateFilterParamCounts(param.name, newFilters);
          return Object.assign(paramValues, {
            [param.name]: JSON.stringify({ filters: newFilters })
          });
        }
        else {
          console.warn('Unable to handle unexpected param type `%o`.', param.type);
          return paramValues;
        }
      }, Object.assign({}, this.state.paramValues));
      this.setState({ paramValues })
    });
  }

  /**
   * Fetch answer value for each group of parameters and update state with
   * counts. Default values will be used for parameters in groups to the right
   * of each group, and user supplied values will be used for the rest.
   *
   * @param {Iterable<Group>} groups
   */
  _updateGroupCounts(groups) {

    // set loading state for group counts
    const groupUIState = groups.reduce((state, group) => Object.assign(state, {
      [group.name]: { accumulatedTotal: 'loading' }
    }), Object.assign({}, this.state.groupUIState));

    this.setState({ groupUIState });

    const defaultParamValues = this.state.question.parameters.reduce(function(defaultParamValues, param) {
      return Object.assign(defaultParamValues, { [param.name]: param.defaultValue });
    }, {});

    // transform each group into an answer value promise with accumulated param
    // values of previous groups
    const countsByGroup = Seq.from(groups)
      .map(group => Seq.from(this.state.question.groups)
        .takeWhile(g => g !== group)
        .concat(Seq.of(group)))
      .map(groups => [
        groups.last(),
        {
          questionName: this.state.question.name,
          parameters: groups.reduce((paramValues, group) => {
            return group.parameters.reduce((paramValues, paramName) => {
              return Object.assign(paramValues, {
                [paramName]: this.state.paramValues[paramName]
              });
            }, paramValues);
          }, Object.assign({}, defaultParamValues))
        }
      ])
      .map(([ group, answerSpec ]) => {
        return this.props.wdkService.getAnswer(answerSpec).then(answer => {
          return [ group, answer.meta.totalCount ];
        });
      });

    Promise.all(countsByGroup).then(counts => {
      const groupUIState = counts.reduce((groupUIState, [ group, accumulatedTotal ]) => {
        return Object.assign(groupUIState, { [group.name]: { accumulatedTotal } });
      }, {});
      this.setState({ groupUIState: Object.assign({}, this.state.groupUIState, groupUIState) });
    });
  }

  _updateFilterParamCounts(paramName, filters) {
    this.props.wdkService.getFilterParamSummaryCounts(
      this.state.question.urlSegment,
      paramName,
      filters,
      this.state.paramValues
    ).then(counts => {
      this._updateParamUIState(paramName, { counts });
    });
  }

  _updateOntologyTermSummary(paramName, ontologyTerm, filters) {
    this.props.wdkService.getOntologyTermSummary(
      this.state.question.urlSegment,
      paramName,
      filters.filter(filter => filter.field !== ontologyTerm),
      ontologyTerm,
      this.state.paramValues
    ).then(ontologyTermSummary => {
      const { ontologyTermSummaries } = this.state.paramUIState[paramName];
      this._updateParamUIState(paramName, {
        ontologyTermSummaries: Object.assign({}, ontologyTermSummaries, {
          [ontologyTerm]: formatSummary(ontologyTermSummary)
        })
      });
    });
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
        totalCount={this.state.totalCount}
        paramValues={this.state.paramValues}
        paramUIState={this.state.paramUIState}
        groupUIState={this.state.groupUIState}
        onActiveGroupChange={this.onActiveGroupChange}
        onActiveOntologyTermChange={this.onActiveOntologyTermChange}
        onParamValueChange={this.onParamValueChange}
        onSubmit={this.onSubmit}
      />
    )
  }

}

QuestionWizardController.propTypes = {
  wdkService: React.PropTypes.object.isRequired,
  questionName: React.PropTypes.string.isRequired
}

/** format ontology term summary */
function formatSummary(summary) {
  return Object.keys(summary).map(value => ({
    value,
    count: summary[value].unfiltered,
    filteredCount: summary[value].filtered
  }));
}

/** create a form element with child input elements */
function createForm(options) {
  const form = document.createElement('form');
  form.action = options.action;
  form.method = options.method;
  options.elements.forEach(element => {
    const input = document.createElement('input');
    input.name = element.name;
    input.value = element.value;
    form.appendChild(input);
  });
  document.body.appendChild(form);
  return form;
}
