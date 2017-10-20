import React from 'react';
import PropTypes from 'prop-types';
import QuestionWizard from '../components/QuestionWizard';
import {
  createInitialState,
  getDefaultParamValues,
  setFilterPopupVisiblity,
  setFilterPopupPinned,
  resetParamValues
} from '../util/QuestionWizardState';
import { Seq } from 'wdk-client/IterableUtils';
import { synchronized } from 'wdk-client/PromiseUtils';
import { Dialog } from 'wdk-client/Components';
import { wrappable } from 'wdk-client/ComponentUtils';
import { groupBy, isEqual, memoize, pick, mapValues, debounce, flow, ary, identity } from 'lodash';

//  type State = {
//    question: Question;
//    activeGroup: Group;
//    groupUIState: Record<string, {
//      valid?: boolean;
//      loading?: boolean;
//      accumulatedTotal?: boolean;
//    }>;
//    paramUIState: Record<string, any>;
//    paramValues: Record<string, string>;
//  }

// FIXME Don't update param dependencies if value is empty

/**
 * Controller for question wizard
 *
 * FIXME Move state management into a Store. As-is, there are potential race
 * conditions due to `setState()` being async.
 */
class QuestionWizardController extends React.Component {

  constructor(props) {
    super(props);
    this.state = { };
    this.parameterMap = null;
    this.eventHandlers = mapValues(this.getEventHandlers(), handler => handler.bind(this));

    this._getAnswerCount = memoize(this._getAnswerCount, (...args) => JSON.stringify(args));
    this._getFilterCounts = memoize(this._getFilterCounts, (...args) => JSON.stringify(args));
    this._updateGroupCounts = synchronized(this._updateGroupCounts);
    // this._handleParamValueChange = synchronized(this._handleParamValueChange);
    // this._updateDependedParams = synchronized(this._updateDependedParams);
    this._commitParamValueChange = debounce(synchronized(this._commitParamValueChange, 1000));
  }

  getEventHandlers() {
    return pick(this, [
      'setActiveGroup',
      'setActiveOntologyTerm',
      'setParamValue',
      'updateInvalidGroupCounts',
      'setFilterPopupVisiblity',
      'setFilterPopupPinned',
      'resetParamValues'
    ]);
  }

  loadQuestion(props) {
    const { questionName, wdkService, isRevise, paramValues } = props;

    const question$ = isRevise
      ? wdkService.sendRequest({
        method: 'POST',
        path: '/questions/' + questionName,
        body: JSON.stringify({
          contextParamValues: paramValues
        })
      })
      : wdkService.sendRequest({
        method: 'GET',
        path: '/questions/' + questionName,
        params: { expandParams: true }
      });

    const recordClass$ = question$.then(question => {
      return wdkService.findRecordClass(rc => rc.name === question.recordClassName);
    });

    Promise.all([ question$, recordClass$ ]).then(
      ([ question, recordClass ]) => {
        this.setState(createInitialState(question, recordClass, paramValues), () => {
          document.title = `Search for ${recordClass.displayName} by ${question.displayName}`;
          // store <string, Parameter>Map for quick lookup
          this.parameterMap = new Map(question.parameters.map(p => [ p.name, p ]))

          const defaultParamValues = getDefaultParamValues(this.state);
          const lastConfiguredGroup = Seq.from(question.groups)
            .filter(group => group.parameters.some(paramName => paramValues[paramName] !== defaultParamValues[paramName]))
            .last();
          const configuredGroups = lastConfiguredGroup == null ? []
            : Seq.from(question.groups)
                .takeWhile(group => group !== lastConfiguredGroup)
                .concat(Seq.of(lastConfiguredGroup));

          this._updateGroupCounts(configuredGroups);
          this._getAnswerCount({
            questionName: question.name,
            parameters: defaultParamValues
          }).then(initialCount => {
            this.setState({ initialCount });
          });
        });
      },
      error => {
        this.setState({ error });
      }
    );
  }

  // Top level action creator methods
  // --------------------------------


  /**
   * Update selected group and its count.
   */
  setActiveGroup(activeGroup) {
    this.setState({ activeGroup });

    if (activeGroup == null) return;

    // FIXME Updating group counts and filter param counts needs to wait for
    // any dependent param updates to finish first.

    // Update counts for active group and upstream groups
    const groupsToUpdate = Seq.from(this.state.question.groups)
      .takeWhile(group => group !== activeGroup)
      .concat(Seq.of(activeGroup));

    this._updateGroupCounts(groupsToUpdate);

    // TODO Perform sideeffects elsewhere
    // BEGIN_SIDE_EFFECTS
    this._initializeActiveGroupParams(activeGroup);
    // END_SIDE_EFFECTS
  }

  /**
   * Set filter popup visiblity
   */
  setFilterPopupVisiblity(show) {
    this.setState(state => setFilterPopupVisiblity(state, show));
  }

  /**
   * Set filter popup stickyness
   */
  setFilterPopupPinned(pinned) {
    this.setState(state => setFilterPopupPinned(state, pinned));
  }

  /**
   * Set all params to default values
   */
  resetParamValues() {
    this.setState(resetParamValues)
  }

  /**
   * Force stale counts to be updated.
   */
  updateInvalidGroupCounts() {
    this._updateGroupCounts(
      Seq.from(this.state.question.groups)
        .filter(group => this.state.groupUIState[group.name].valid === false));
  }

  /**
   * Update paramUI state based on ontology term.
   */
  setActiveOntologyTerm(param, filters, ontologyTerm) {
    this.setState(updateState(['paramUIState', param.name, 'activeOntologyTerm'], ontologyTerm));
    if (this._getParamUIState(this.state, param.name).ontologyTermSummaries[ontologyTerm] == null) {
      this._updateOntologyTermSummary(param.name, ontologyTerm, filters);
    }
  }

  /**
   * Update parameter value, update dependent parameter vocabularies and
   * ontologies, and update counts.
   */
  setParamValue(param, paramValue) {
    const prevParamValue = this.state.paramValues[param.name];
    this.setState(updateState(['paramValues', param.name], paramValue),
      () => this._commitParamValueChange(param, paramValue, prevParamValue));
  }

  _initializeActiveGroupParams(activeGroup) {
    activeGroup.parameters.forEach(paramName => {
      const param = this.state.question.parameters.find(param => param.name === paramName);
      if (param == null) throw new Error("Could not find param `" + paramName + "`.");
      if (param.type === 'FilterParamNew') {
        const {
          activeOntologyTerm,
          ontologyTermSummaries
        } = this._getParamUIState(this.state, paramName);
        const { filters } = JSON.parse(this.state.paramValues[param.name]);
        this._updateFilterParamCounts(param.name, filters);
        if (activeOntologyTerm && ontologyTermSummaries[activeOntologyTerm] == null) {
          this._updateOntologyTermSummary(param.name, activeOntologyTerm, filters);
        }
      }
    })
  }

  _commitParamValueChange(param, paramValue, prevParamValue) {
    console.log('committing param value change', param, paramValue, prevParamValue);
    const groups = Seq.from(this.state.question.groups);
    const currentGroup = groups.find(group => group.parameters.includes(param.name));
    groups
      .dropWhile(group => group !== currentGroup)
      .drop(1)
      .takeWhile(group => this._groupHasCount(group))
      .forEach(group => {
        this.setState(updateState(['groupUIState', group.name, 'valid'], false));
      })

    return Promise.all([
      this._handleParamValueChange(param, paramValue, prevParamValue),
      this._updateDependedParams(param, paramValue, this.state.paramValues).then(nextState => {
        this.setState(nextState, () => {
          this._updateGroupCounts(Seq.of(currentGroup));
          this._initializeActiveGroupParams(this.state.activeGroup);
        });
      })
    ]);
  }

  _handleParamValueChange(param, paramValue, prevParamValue) {
    if (param.type === 'FilterParamNew') {
      const { filters = [] } = JSON.parse(paramValue);
      const { filters: oldFilters = [] } = JSON.parse(prevParamValue);
      const { activeOntologyTerm, ontologyTermSummaries } = this._getParamUIState(this.state, param.name);

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

      this.setState(updateState(['paramUIState', param.name, 'ontologyTermSummaries'], newOntologyTermSummaries));

      return Promise.all([
        this._updateFilterParamCounts(param.name, filters),
        // This only needs to be called if the modified filter value is not for
        // the active ontology term.
        shouldUpdateActiveOntologyTermSummary &&
          this._updateOntologyTermSummary(param.name, activeOntologyTerm, filters)
      ]);
    }

    return Promise.resolve();
  }

  /**
   * Returns a new object with updated paramValues and paramUIState
   * @param {*} rootParam
   * @param {*} paramValue
   */
  _updateDependedParams(rootParam, paramValue, paramValues) {
    return this.props.wdkService.getQuestionParamValues(
      this.state.question.urlSegment,
      rootParam.name,
      paramValue,
      paramValues
    ).then(
      // for each parameter, reinitialize param state and value
      // these are params with a vocab, so we have to check if current value is compatible
      // if not, then reset value to default
      parameters =>
        Seq.from(parameters)
          .uniqBy(p => p.name)
          .flatMap(param => {
            switch(param.type) {
              case 'FilterParamNew': {
                // TODO update param value with invalid filters removed
                const terms = new Set(param.ontology.map(entry => entry.term));
                const { filters: prevFilters = [] } = JSON.parse(this.state.paramValues[param.name]);
                const filters = prevFilters.filter(filter => terms.has(filter.field));
                if (prevFilters.length !== filters.length) {
                  console.log('Invalid filters detected', { prevFilters, filters });
                }

                // Return new state object with updates to param state and value
                return [
                  updateState(['paramUIState', param.name, 'ontologyTermSummaries'], {}),
                  updateState(['paramUIState', param.name, 'ontology'], param.ontology),
                  updateState(['paramValues', param.name], JSON.stringify({ filters }))
                ]
              }
              case 'FlatVocabParam':
              case 'EnumParam': {
                const value = this.state.paramValues[param.name];
                return [
                  updateState(['paramUIState', param.name, 'vocabulary'], param.vocabulary),
                  updateState(['paramValues', param.name],
                    param.vocabulary.includes(value) ? value : param.defaultValue)
                ]
              }
              default: {
                console.warn('Unable to handle unexpected param type `%o`.', param.type);
                return [identity];
              }
            }
          })
          .reduce(ary(flow, 2), identity)
    );
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
      [group.name]: Object.assign({}, state[group.name], {
        loading: true,
        // XXX Why are we setting valid true here?
        valid: true
      })
    }), Object.assign({}, this.state.groupUIState));

    this.setState({ groupUIState });

    const defaultParamValues = getDefaultParamValues(this.state);

    // transform each group into an answer value promise with accumulated param
    // values of previous groups
    const stateByGroup = Seq.from(groups)
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
        const params = group.parameters.map(paramName => this.parameterMap.get(paramName));
        return (params.length === 1 && params[0].type === 'FilterParamNew'
          ? this._getFilterCounts(
              params[0].name,
              JSON.parse(this.state.paramValues[params[0].name]).filters,
              answerSpec.parameters
            ).then(counts => counts.filtered)

          : this._getAnswerCount(answerSpec)
        ).then(
          totalCount => [ group, { accumulatedTotal: totalCount, valid: true, loading: false} ],
          error => {
            console.error('Error loading group count for %o.', group, error);
            return [ group, { valid: false, loading: false } ];
          }
        ).then(
          ([ group, state ]) => {
            const groupUIState = Object.assign({}, this.state.groupUIState, {
              [group.name]: Object.assign({}, this.state.groupUIState[group.name], state)
            });
            this.setState({ groupUIState });
          }
        );
      });

    return Promise.all(stateByGroup);
  }

  _getAnswerCount(answerSpec) {
    const formatting = {
      formatConfig: {
        pagination: { offset: 0, numRecords: 0 }
      }
    };
    return this.props.wdkService.getAnswer(answerSpec, formatting).then(
      answer => answer.meta.totalCount,
      error => {
        this.setState({ error });
      }
    );
  }

  _getFilterCounts(paramName, filters, paramValues) {
    return this.props.wdkService.getFilterParamSummaryCounts(
      this.state.question.urlSegment,
      paramName,
      filters,
      paramValues
    );
  }

  _updateFilterParamCounts(paramName, filters) {
    return this._getFilterCounts(paramName, filters, this.state.paramValues).then(
      counts => {
        const uiState = this.state.paramUIState[paramName];
        this.setState(updateState(['paramUIState', paramName], Object.assign({}, uiState, {
          filteredCount: counts.filtered,
          unfilteredCount: counts.unfiltered
        })))
      },
      error => {
        this.setState({ error });
      }
    );
  }

  _updateOntologyTermSummary(paramName, ontologyTerm, filters) {
    return this.props.wdkService.getOntologyTermSummary(
      this.state.question.urlSegment,
      paramName,
      filters.filter(filter => filter.field !== ontologyTerm),
      ontologyTerm,
      this.state.paramValues
    ).then(
      ontologyTermSummary => {
        const { ontologyTermSummaries } = this.state.paramUIState[paramName];
        this.setState(updateState(['paramUIState', paramName, 'ontologyTermSummaries'],
          Object.assign({}, ontologyTermSummaries, {
            [ontologyTerm]: ontologyTermSummary
          })));
      },
      error => {
        this.setState({ error });
      }
    );
  }

  _getParamUIState(state, paramName) {
    return state.paramUIState[paramName];
  }

  _groupHasCount(group) {
    return this.state.groupUIState[group.name].accumulatedTotal != null;
  }

  componentDidMount() {
    this.loadQuestion(this.props);
  }

  componentDidWillReceiveProps(nextProps) {
    this.loadQuestion(nextProps);
  }

  render() {
    return (
      <div>
        {this.state.error && (
          <Dialog open modal title="An error occurred" onClose={() => this.setState({ error: undefined })}>
            {Seq.from(this.state.error.stack.split('\n'))
              .flatMap(line => [ line, <br/> ])}
          </Dialog>
        )}
        {this.state.question && (
          <QuestionWizard
            eventHandlers={this.eventHandlers}
            wizardState={this.state}
            customName={this.props.customName}
            isAddingStep={this.props.isAddingStep}
            showHelpText={!this.props.isRevise}
          />
        )}
      </div>
    )
  }

}

QuestionWizardController.propTypes = {
  wdkService: PropTypes.object.isRequired,
  questionName: PropTypes.string.isRequired,
  paramValues: PropTypes.object.isRequired,
  isRevise: PropTypes.bool.isRequired,
  isAddingStep: PropTypes.bool.isRequired,
  customName: PropTypes.string
}

export default wrappable(QuestionWizardController);

/**
 * Creates an updater function that returns a new state object
 * with an updated value at the specified path.
 */
function updateState(path, value) {
  return function update(state) {
    return updateObjectImmutably(state, path, value);
  }
}

/**
 * Creates a new object based on input object with an updated value
 * a the specified path.
 */
function updateObjectImmutably(object, [key, ...restPath], value) {
  const isObject = typeof object === 'object';
  if (!isObject || (isObject && !(key in object)))
    throw new Error("Invalid key path");

  return Object.assign({}, object, {
    [key]: restPath.length === 0 ? value
      : updateObjectImmutably(object[key], restPath, value)
  })
}
