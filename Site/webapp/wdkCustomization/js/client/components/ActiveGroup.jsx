import { result } from 'lodash';
import { Seq } from 'wdk-client/IterableUtils';
import { Loading } from 'wdk-client/Components';
import { propTypes } from './QuestionWizard';
import Parameters from './Parameters';
import { makeQuestionWizardClassName as makeClassName } from '../util/classNames';
import { groupParamsValuesAreDefault } from '../util/QuestionWizardState';
import { wrappable } from 'wdk-client/ComponentUtils';

/**
 * Active group section. Includes heading, help text, summary counts, and parameters.
 */
function ActiveGroup(props) {
  if (props.wizardState.activeGroup == null) return null;

  const {
    wizardState: {
      question,
      paramValues,
      paramUIState,
      groupUIState,
      recordClass,
      activeGroup,
      initialCount
    },
    eventHandlers: {
      setActiveOntologyTerm,
      updateOntologyTermSummary,
      setOntologyTermSort,
      setOntologyTermSearch,
      setParamValue,
      setParamState
    }
  } = props;

  const paramMap = new Map(question.parameters.map(p => [p.name, p]));
  const { accumulatedTotal, loading } = groupUIState[activeGroup.name];
  const { accumulatedTotal: prevAccumulatedTotal, loading: prevLoading } = Seq.of({ accumulatedTotal: initialCount })
    .concat(Seq.from(question.groups)
      .takeWhile(group => group !== activeGroup)
      .map(group => groupUIState[group.name]))
    .last();
  const parameters = activeGroup.parameters
    .map(paramName => paramMap.get(paramName))
    .filter(param => param.isVisible);

  const loadingEl = <Loading radius={2} className={makeClassName('GroupLoading')}/>;

  return (
    <div className={makeClassName('ActiveGroupContainer')}>
      <div className={makeClassName('ActiveGroupHeading')}>
        {groupParamsValuesAreDefault(props.wizardState, activeGroup) ? (
          <div className={makeClassName('ActiveGroupCount')}>
            No <em>{activeGroup.displayName}</em> filters applied yet
          </div>
        ) : (
          <div className={makeClassName('ActiveGroupCount')}>
            Your <em>{activeGroup.displayName}</em> filters reduce {
              (prevLoading ? loadingEl : result(prevAccumulatedTotal, 'toLocaleString'))
            } {recordClass.displayNamePlural} to {
              (loading ? loadingEl : result(accumulatedTotal, 'toLocaleString'))
            }
          </div>
        )}
        {activeGroup.description && (
          <div className={makeClassName('ActiveGroupDescription')}>{activeGroup.description}</div>
        )}
      </div>
      <Parameters
        group={activeGroup}
        parameters={parameters}
        paramValues={paramValues}
        paramUIState={paramUIState}
        onActiveOntologyTermChange={setActiveOntologyTerm}
        onOntologyTermSummaryUpdateRequest={updateOntologyTermSummary}
        onOntologyTermSort={setOntologyTermSort}
        onOntologyTermSearch={setOntologyTermSearch}
        onParamValueChange={setParamValue}
        onParamStateChange={setParamState}
      />
    </div>
  );
}

ActiveGroup.propTypes = propTypes;

export default wrappable(ActiveGroup);
